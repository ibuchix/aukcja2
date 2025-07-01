
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBidCount = (carId: string) => {
  return useQuery({
    queryKey: ["bid-count", carId],
    queryFn: async () => {
      if (!carId) return { count: 0, uniqueBidders: 0 };
      
      const { data, error } = await supabase
        .from("bids")
        .select("dealer_id")
        .eq("car_id", carId);

      if (error) {
        console.error("Error fetching bid count:", error);
        return { count: 0, uniqueBidders: 0 };
      }

      const totalBids = data?.length || 0;
      const uniqueBidders = new Set(data?.map(bid => bid.dealer_id)).size;

      return { count: totalBids, uniqueBidders };
    },
    enabled: !!carId,
  });
};
