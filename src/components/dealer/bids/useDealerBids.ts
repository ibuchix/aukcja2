
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MyBid } from "./types";

export function useDealerBids(dealerProfileId: string | undefined) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeInitialized, setRealtimeInitialized] = useState(false);

  const {
    data: myBids,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["myBids", dealerProfileId],
    queryFn: async () => {
      if (!dealerProfileId) return [];

      // Use the materialized view for better performance
      const { data, error } = await supabase
        .from("mv_dealer_bids")
        .select(`
          car_id,
          my_highest_bid,
          outbid,
          title,
          make,
          model,
          year,
          auction_end_time,
          current_bid,
          auction_status
        `)
        .eq("dealer_id", dealerProfileId)
        .in("auction_status", ["active"])
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      // Get proxy bids for these cars
      const carIds = data.map((bid) => bid.car_id);
      const { data: proxyBids } = await supabase
        .from("proxy_bids")
        .select("car_id, max_bid_amount")
        .eq("dealer_id", dealerProfileId)
        .in("car_id", carIds);

      // Merge proxy bid data and transform to the expected format
      return data.map((bid) => ({
        id: `${bid.car_id}-${dealerProfileId}`, // Create a unique ID
        car_id: bid.car_id,
        amount: bid.my_highest_bid,
        status: bid.outbid ? 'outbid' : 'active',
        created_at: new Date().toISOString(), // Not in materialized view
        car: {
          id: bid.car_id,
          title: bid.title,
          make: bid.make,
          model: bid.model,
          year: bid.year,
          auction_end_time: bid.auction_end_time,
          current_bid: bid.current_bid,
          auction_status: bid.auction_status
        },
        proxy_bid: proxyBids?.find((pb) => pb.car_id === bid.car_id),
      })) as MyBid[];
    },
    enabled: !!dealerProfileId,
  });

  // Set up realtime listeners for bid status changes
  useEffect(() => {
    if (!dealerProfileId || !myBids || myBids.length === 0 || realtimeInitialized) return;

    // Set up realtime subscription for the dealer's bids
    const channel = supabase
      .channel('dealer_bids_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${dealerProfileId}`,
        },
        (payload) => {
          console.log('Bid status changed:', payload);
          // Trigger a refetch to get updated data
          refetch();
        }
      )
      .subscribe();

    // Set up realtime subscription for car status/current_bid changes
    const carIds = myBids.map(bid => bid.car_id);
    const carChannel = supabase
      .channel('dealer_cars_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `id=in.(${carIds.join(',')})`,
        },
        (payload) => {
          console.log('Car status changed:', payload);
          // Trigger a refetch to get updated data
          refetch();
        }
      )
      .subscribe();

    setRealtimeInitialized(true);

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(carChannel);
    };
  }, [dealerProfileId, myBids, refetch, realtimeInitialized]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return {
    myBids,
    isLoading,
    isRefreshing,
    handleRefresh,
  };
}
