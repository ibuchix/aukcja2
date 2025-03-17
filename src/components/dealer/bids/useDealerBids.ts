
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MyBid } from "./types";

export function useDealerBids(dealerProfileId: string | undefined) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: myBids,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["myBids", dealerProfileId],
    queryFn: async () => {
      if (!dealerProfileId) return [];

      const { data, error } = await supabase
        .from("bids")
        .select(`
          id,
          car_id,
          amount,
          status,
          created_at,
          car:cars(
            id,
            title,
            make,
            model,
            year,
            auction_end_time,
            current_bid,
            auction_status
          )
        `)
        .eq("dealer_id", dealerProfileId)
        .in("status", ["active", "outbid"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get proxy bids for these cars
      const carIds = data.map((bid) => bid.car_id);
      const { data: proxyBids } = await supabase
        .from("proxy_bids")
        .select("car_id, max_bid_amount")
        .eq("dealer_id", dealerProfileId)
        .in("car_id", carIds);

      // Merge proxy bid data
      return data.map((bid) => ({
        ...bid,
        proxy_bid: proxyBids?.find((pb) => pb.car_id === bid.car_id),
      })) as MyBid[];
    },
    enabled: !!dealerProfileId,
  });

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
