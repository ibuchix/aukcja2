
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Type guard for valid bid data
const isValidBid = (bid: any): bid is { dealer_id: string } => {
  return bid !== null && 
         typeof bid === 'object' && 
         !('message' in bid) && // Check it's not an error object
         !('code' in bid) && // Additional check for error objects
         !('error' in bid) && // Additional check for SelectQueryError
         'dealer_id' in bid && 
         typeof bid.dealer_id === 'string' && 
         bid.dealer_id.length > 0;
};

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

      // Filter out any invalid entries first - let TypeScript infer the type after filtering
      const validBids = data.filter(isValidBid);
      const totalBids = validBids.length;
      const uniqueBidders = new Set(validBids.map(bid => bid.dealer_id)).size;

      return { count: totalBids, uniqueBidders };
    },
    enabled: !!carId,
  });
};
