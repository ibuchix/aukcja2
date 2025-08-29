
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
  auction_status: string;
  reserve_price: number;
  awaiting_seller_decision: boolean;
}

interface BidData {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
  dealer_id: string;
}

// Type guard specifically for this file's BidData type
function isValidBidData(item: any): item is BidData {
  return item !== null && 
    typeof item === 'object' && 
    'id' in item &&
    'car_id' in item &&
    'amount' in item &&
    'status' in item &&
    'created_at' in item &&
    'dealer_id' in item;
}

export function useDealerBids(dealerProfileId: string | undefined) {
  const [isRefreshing, setIsRefreshing] = useState(false);
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

      // Fetching bids for dealer

      // Get only this dealer's bids (RLS will filter automatically)
      const { data: dealerBids, error: bidsError } = await supabase
        .from("bids")
        .select(`
          id,
          car_id,
          amount,
          status,
          created_at,
          dealer_id
        `)
        .eq('dealer_id', dealerProfileId)
        .eq('status', 'active')
        .order("created_at", { ascending: false });

      // Get won vehicles for this dealer to determine win/loss status
      const { data: wonVehicles, error: wonError } = await supabase
        .from("dealer_won_vehicles")
        .select("car_id, dealer_id")
        .eq('dealer_id', dealerProfileId);

      // Bids query completed

      if (bidsError) {
        console.error('Error fetching bids:', bidsError);
        throw bidsError;
      }

      if (wonError) {
        console.error('Error fetching won vehicles:', wonError);
        // Don't throw - we can still show bids without win/loss status
      }
      
      if (!dealerBids || dealerBids.length === 0) {
        console.log('No bids found for dealer');
        return [] as MyBid[];
      }

      // Found bids for processing

      // Filter to ensure we only have valid bids
      const validBids = safelyFilterData(dealerBids, isValidBidData);
      // Valid bids filtered

      // Get car details for these bids
      const carIds = validBids.map(bid => bid.car_id).filter(Boolean);
      
      if (carIds.length === 0) {
        console.log('No valid car IDs found');
        return [] as MyBid[];
      }
      
      // Fetching car details

      // Get cars data - only what we need, no current_bid
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          make,
          model,
          year,
          auction_end_time,
          auction_status,
          reserve_price,
          awaiting_seller_decision
        `)
        .in("id", carIds);
      
      // Cars query completed
      
      if (carsError) {
        console.error('Error fetching cars:', carsError);
        throw carsError;
      }

      // Create a lookup table for cars
      const carsById: Record<string, any> = {};
      
      if (cars && Array.isArray(cars)) {
        const validCars = safelyFilterData(cars, isValidCarData);
        // Valid cars filtered
        
        validCars.forEach(car => {
          if (car && car.id) {
            carsById[car.id] = car;
          }
        });
      }

      // Build the result without complex status calculations since we're not showing them
      const result = validBids
        .map(bid => {
          const car = carsById[bid.car_id];
          if (!car) {
            return null; // Skip if car not found
          }
          
          // Calculate auction timing status
          const now = new Date();
          const auctionEndTime = car.auction_end_time ? new Date(car.auction_end_time) : null;
          
          let auctionTimingStatus = 'unknown';
          
          if (auctionEndTime) {
            if (now > auctionEndTime) {
              auctionTimingStatus = 'ended';
            } else {
              const hoursUntilEnd = (auctionEndTime.getTime() - now.getTime()) / (1000 * 60 * 60);
              if (hoursUntilEnd <= 24 && car.auction_status === 'active') {
                auctionTimingStatus = 'active';
              } else {
                auctionTimingStatus = 'scheduled';
              }
            }
          }

          // Determine auction result (won/lost) only for ended auctions
          let auctionResult: 'won' | 'lost' | null = null;
          if (auctionTimingStatus === 'ended' && Array.isArray(wonVehicles)) {
            const wonThisVehicle = wonVehicles.some((won: any) => won.car_id === bid.car_id);
            if (wonThisVehicle) {
              auctionResult = 'won';
            } else {
              // Only mark as lost if the auction actually ended, not just because we don't have won record
              auctionResult = 'lost';
            }
          }
          
          const myBid: MyBid = {
            id: bid.id,
            car_id: bid.car_id,
            amount: bid.amount,
            status: bid.status,
            created_at: bid.created_at,
            auctionTimingStatus,
            auctionResult,
            car: {
              id: car.id,
              title: car.title || `${car.year} ${car.make} ${car.model}`,
              make: car.make,
              model: car.model,
              year: car.year,
              auction_end_time: car.auction_end_time,
              auction_status: car.auction_status,
              reserve_price: car.reserve_price,
              awaiting_seller_decision: car.awaiting_seller_decision
            }
          };
          
          return myBid;
        })
        .filter((bid): bid is MyBid => bid !== null);
        
      // Final result processed successfully
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
    if (!dealerProfileId || !myBids || myBids.length === 0) return;

    // Set up realtime subscription for the dealer's bids
    const channel = supabase
      .channel('dealer_bids_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          // Bid changed, invalidating cache
          // Invalidate query to trigger a refetch
          queryClient.invalidateQueries({
            queryKey: queryKey,
          });
        }
      )
      .subscribe();

    // Set up realtime subscription for car status changes
    const carIds = myBids.map(bid => bid.car_id);
    if (carIds.length > 0) {
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
            // Car status changed, invalidating cache
            // Invalidate query to trigger a refetch
            queryClient.invalidateQueries({
              queryKey: queryKey,
            });
          }
        )
        .subscribe();

      // Clean up subscriptions
      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(carChannel);
      };
    }

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerProfileId, myBids, queryClient, queryKey]);

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
