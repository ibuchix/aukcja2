
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters } from "./types";

export const useAuctionQueries = (dealerId: string) => {
  const { data: cars, isLoading, error } = useQuery({
    queryKey: ["auctionListings", dealerId],
    queryFn: async () => {
      console.log("Fetching auction listings for dealer:", dealerId);
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching auction listings:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} auction listings`);
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // Process the data to separate into different categories - add safety checks
  const activeAuctions = cars?.filter(car => 
    car && 
    typeof car === 'object' && 
    'is_auction' in car && 
    'auction_status' in car && 
    car.is_auction && 
    car.auction_status === 'active'
  ) || [];
  
  const wonAuctions = cars?.filter(car => 
    car && 
    typeof car === 'object' && 
    'is_auction' in car && 
    'auction_status' in car && 
    car.is_auction && 
    car.auction_status === 'sold'
  ) || [];
  
  const lostAuctions = cars?.filter(car => 
    car && 
    typeof car === 'object' && 
    'is_auction' in car && 
    'auction_status' in car && 
    car.is_auction && 
    car.auction_status === 'ended'
  ) || [];

  return {
    activeAuctions,
    loadingActive: isLoading,
    wonAuctions,
    loadingWon: isLoading,
    lostAuctions,
    loadingLost: isLoading,
  };
};
