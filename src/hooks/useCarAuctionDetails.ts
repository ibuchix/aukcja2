import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateAuctionTimingStatus } from "@/components/dealer/auction/hooks/utils/auctionTimingUtils";
import { processCarData } from "@/utils/carDataHelpers";
import { fetchCarFileUploads } from "@/utils/imageUtils/carFileUploads";
import { useEffect } from "react";

interface UseCarAuctionDetailsProps {
  carId: string;
}

export const useCarAuctionDetails = ({ carId }: UseCarAuctionDetailsProps) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["carAuctionDetails", carId],
    queryFn: async () => {
      if (!carId) throw new Error("Car ID is required");

      // Fetch car data
      const { data: carData, error: carError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .eq("is_auction", true)
        .single();

      if (carError) throw carError;
      if (!carData) throw new Error("Car not found");

      // Fetch auction schedule
      const { data: scheduleRaw } = await supabase
        .from("auction_schedules")
        .select("id, start_time, end_time, status, is_manually_controlled")
        .eq("car_id", carId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const scheduleData = scheduleRaw as unknown as { id: string; start_time: string; end_time: string; status: string; is_manually_controlled: boolean } | null;

      // Fetch file uploads
      const fileUploads = await fetchCarFileUploads([carId]);
      
      // Merge data
      const carWithData = {
        ...(carData as unknown as Record<string, unknown>),
        fileUploads: fileUploads || [],
        auction_schedules: scheduleData ? [scheduleData] : []
      };

      // Process car data
      const processedCars = processCarData([carWithData]);
      const processedCar = processedCars[0];
      if (!processedCar) throw new Error("Error processing car data");

      // Calculate timing status
      const auctionTimingStatus = scheduleData 
        ? calculateAuctionTimingStatus(scheduleData.start_time, scheduleData.end_time, scheduleData.status)
        : 'unknown';

      return {
        ...processedCar,
        auctionTimingStatus,
        scheduleStartTime: scheduleData?.start_time,
        scheduleEndTime: scheduleData?.end_time,
        auctionEndTime: scheduleData?.end_time,
        scheduleStatus: scheduleData?.status,
        isManuallyControlled: scheduleData?.is_manually_controlled,
      };
    },
    enabled: !!carId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!carId) return;
    const channel = supabase
      .channel(`car-auction-${carId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cars', filter: `id=eq.${carId}` },
        () => queryClient.invalidateQueries({ queryKey: ["carAuctionDetails", carId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `car_id=eq.${carId}` },
        () => queryClient.invalidateQueries({ queryKey: ["carAuctionDetails", carId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [carId, queryClient]);

  return { car: query.data, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
};
