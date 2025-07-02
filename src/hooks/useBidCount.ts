

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

      // Ensure data is an array and contains valid bid objects
      if (!Array.isArray(data)) {
        console.error("Expected array but got:", data);
        return { count: 0, uniqueBidders: 0 };
      }

      // Filter out any invalid entries and extract dealer_ids
      const validBids = data.filter((bid): bid is NonNullable<typeof bid> & { dealer_id: string } => 
        bid !== null && 
        typeof bid === 'object' && 
        'dealer_id' in bid && 
        typeof bid.dealer_id === 'string' &&
        bid.dealer_id.length > 0
      );

      const totalBids = validBids.length;
      const uniqueBidders = new Set(validBids.map(bid => bid.dealer_id)).size;

      return { count: totalBids, uniqueBidders };
    },
    enabled: !!carId,
  });
};
