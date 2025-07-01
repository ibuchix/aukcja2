
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MyBid } from "./types";
import { queryKeys } from "@/utils/queryClient";
import { 
  isValidCarData, 
  safelyFilterData
} from "@/utils/supabaseHelpers";

interface CarData {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  auction_end_time: string;
  current_bid: number;
  auction_status: string;
}

interface BidData {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
}

// Type guard specifically for this file's BidData type
function isValidBidData(item: any): item is BidData {
  return item !== null && 
    typeof item === 'object' && 
    'id' in item &&
    'car_id' in item &&
    'amount' in item &&
    'status' in item &&
    'created_at' in item;
}

export function useDealerBids(dealerProfileId: string | undefined) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeInitialized, setRealtimeInitialized] = useState(false);
  const queryClient = useQueryClient();

  const queryKey = dealerProfileId 
    ? queryKeys.bids.dealerBids(dealerProfileId) 
    : ['myBids'];

  const {
    data: myBids,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!dealerProfileId) {
        console.log('No dealer profile ID provided');
        return [];
      }

      console.log('=== FETCHING DEALER BIDS ===');
      console.log('Fetching bids for dealer:', dealerProfileId);

      // First, let's verify the dealer exists
      const { data: dealerVerification, error: dealerError } = await supabase
        .from("dealers")
        .select("id, user_id, dealership_name, is_verified")
        .eq("id", dealerProfileId)
        .single();

      console.log('Dealer verification:', { dealerVerification, dealerError });

      if (dealerError || !dealerVerification) {
        console.error('Dealer not found:', dealerError);
        return [];
      }

      // Get all bids for this dealer
      const { data: activeBids, error: bidsError } = await supabase
        .from("bids")
        .select(`
          id,
          car_id,
          amount,
          status,
          created_at
        `)
        .eq("dealer_id", dealerProfileId)
        .order("created_at", { ascending: false });

      console.log('Bids query result:', { activeBids, bidsError });

      if (bidsError) {
        console.error('Error fetching bids:', bidsError);
        throw bidsError;
      }
      
      if (!activeBids || activeBids.length === 0) {
        console.log('No bids found for dealer');
        return [] as MyBid[];
      }

      console.log('Found bids:', activeBids);

      // Filter to ensure we only have valid bids without errors
      const validActiveBids = safelyFilterData(activeBids, isValidBidData);
      console.log('Valid bids after filtering:', validActiveBids);

      // Get car details for these bids
      const carIds = validActiveBids.map(bid => bid.car_id).filter(Boolean);
      
      if (carIds.length === 0) {
        console.log('No valid car IDs found');
        return [] as MyBid[];
      }
      
      console.log('Fetching car details for IDs:', carIds);

      // Get cars without filtering by auction_status to show all bids
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          make,
          model,
          year,
          auction_end_time,
          current_bid,
          auction_status
        `)
        .in("id", carIds);
      
      console.log('Cars query result:', { cars, carsError });
      
      if (carsError) {
        console.error('Error fetching cars:', carsError);
        throw carsError;
      }
      
      // Create a lookup table for cars
      const carsById: Record<string, CarData> = {};
      
      // Filter valid car records and populate the lookup
      if (cars && Array.isArray(cars)) {
        const validCars = safelyFilterData(cars, isValidCarData);
        console.log('Valid cars after filtering:', validCars);
        
        validCars.forEach(car => {
          if (car && car.id) {
            carsById[car.id] = car as CarData;
          }
        });
      }

      // Merge bids with car data (show all bids, not just active auctions)
      const result = validActiveBids
        .map(bid => {
          if (!bid.car_id || !carsById[bid.car_id]) {
            console.log('Skipping bid due to missing car:', bid);
            return null; // Skip if bid is invalid or car not found
          }
          
          const car = carsById[bid.car_id];
          if (!car) {
            return null; // Skip if car not found
          }
          
          const isOutbid = car && car.current_bid > bid.amount;
          
          const myBid: MyBid = {
            id: `${bid.car_id}-${dealerProfileId}`, // Create a unique ID
            car_id: bid.car_id,
            amount: bid.amount,
            status: isOutbid ? 'outbid' : 'active',
            created_at: bid.created_at,
            car: {
              id: car.id,
              title: car.title,
              make: car.make,
              model: car.model,
              year: car.year,
              auction_end_time: car.auction_end_time,
              current_bid: car.current_bid,
              auction_status: car.auction_status
            }
          };
          
          return myBid;
        })
        .filter((bid): bid is MyBid => bid !== null);
        
      console.log('Final result bids:', result);
      console.log('=== END FETCHING DEALER BIDS ===');
      return result;
    },
    enabled: !!dealerProfileId,
    // Refetch every 30 seconds
    refetchInterval: 30 * 1000,
    // Reduce stale time to ensure fresh data after bid placement
    staleTime: 5 * 1000, // 5 seconds
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
          // Invalidate query to trigger a refetch
          queryClient.invalidateQueries({
            queryKey: queryKey,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${dealerProfileId}`,
        },
        (payload) => {
          console.log('New bid inserted:', payload);
          // Invalidate query to trigger a refetch
          queryClient.invalidateQueries({
            queryKey: queryKey,
          });
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
          // Invalidate query to trigger a refetch
          queryClient.invalidateQueries({
            queryKey: queryKey,
          });
        }
      )
      .subscribe();

    setRealtimeInitialized(true);

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(carChannel);
    };
  }, [dealerProfileId, myBids, queryClient, queryKey, realtimeInitialized]);

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
