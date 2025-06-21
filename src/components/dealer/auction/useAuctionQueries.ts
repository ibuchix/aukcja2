
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters } from "./types";

// Type guard for car data
interface ValidCarData {
  id: string;
  is_auction: boolean;
  auction_status: string;
  [key: string]: any;
}

function isValidCar(car: any): car is ValidCarData {
  return car && 
         car !== null && 
         typeof car === 'object' && 
         !('error' in car) && 
         'id' in car && 
         car.id &&
         'is_auction' in car &&
         'auction_status' in car;
}

export const useAuctionQueries = (dealerId: string) => {
  const { data: cars, isLoading, error } = useQuery({
    queryKey: ["auctionListings", dealerId],
    queryFn: async () => {
      console.log("Fetching auction listings for dealer:", dealerId);
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .eq("is_auction", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching auction listings:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} auction listings`);
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes,
  });

  // Process the data to separate into different categories with proper null checks
  const activeAuctions = cars?.filter((car): car is ValidCarData => {
    if (!isValidCar(car)) {
      return false;
    }
    
    return car.is_auction === true && car.auction_status === 'active';
  }) || [];
  
  const wonAuctions = cars?.filter((car): car is ValidCarData => {
    if (!isValidCar(car)) {
      return false;
    }
    
    return car.is_auction === true && car.auction_status === 'sold';
  }) || [];
  
  const lostAuctions = cars?.filter((car): car is ValidCarData => {
    if (!isValidCar(car)) {
      return false;
    }
    
    return car.is_auction === true && car.auction_status === 'ended';
  }) || [];

  return {
    activeAuctions,
    loadingActive: isLoading,
    wonAuctions,
    loadingWon: isLoading,
    lostAuctions,
    loadingLost: isLoading,
  };
};
