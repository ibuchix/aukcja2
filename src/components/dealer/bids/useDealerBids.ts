
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
  reserve_price: number;
  awaiting_seller_decision: boolean;
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
        .order("created_at", { ascending: false });

      console.log('Bids query result:', { dealerBids, bidsError });

      if (bidsError) {
        console.error('Error fetching bids:', bidsError);
        throw bidsError;
      }
      
      if (!dealerBids || dealerBids.length === 0) {
        console.log('No bids found for dealer');
        return [] as MyBid[];
      }

      console.log('Found bids:', dealerBids);

      // Filter to ensure we only have valid bids
      const validBids = safelyFilterData(dealerBids, isValidBidData);
      console.log('Valid bids after filtering:', validBids);

      // Get car details for these bids
      const carIds = validBids.map(bid => bid.car_id).filter(Boolean);
      
      if (carIds.length === 0) {
        console.log('No valid car IDs found');
        return [] as MyBid[];
      }
      
      console.log('Fetching car details for IDs:', carIds);

      // Get cars data
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
          auction_status,
          reserve_price,
          awaiting_seller_decision
        `)
        .in("id", carIds);
      
      console.log('Cars query result:', { cars, carsError });
      
      if (carsError) {
        console.error('Error fetching cars:', carsError);
        throw carsError;
      }
      
      // Create a lookup table for cars
      const carsById: Record<string, any> = {};
      
      if (cars && Array.isArray(cars)) {
        const validCars = safelyFilterData(cars, isValidCarData);
        console.log('Valid cars after filtering:', validCars);
        
        validCars.forEach(car => {
          if (car && car.id) {
            carsById[car.id] = car;
          }
        });
      }

      // Calculate bid status based on auction state and current bid
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
          let bidStatus = bid.status || 'active';
          
          if (auctionEndTime) {
            if (now > auctionEndTime) {
              auctionTimingStatus = 'ended';
              // Determine final bid status based on whether this dealer's bid is the winning bid
              // A dealer wins only if their bid amount matches the current_bid (highest bid)
              // and the current_bid meets or exceeds the reserve price
              if (car.current_bid >= car.reserve_price && car.current_bid === bid.amount) {
                bidStatus = car.awaiting_seller_decision ? 'winning_pending' : 'won';
              } else {
                bidStatus = 'lost';
              }
              } else {
                const hoursUntilEnd = (auctionEndTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursUntilEnd <= 24 && car.auction_status === 'active') {
                  auctionTimingStatus = 'running';
                  // Check if this dealer's bid is currently the highest
                  bidStatus = car.current_bid === bid.amount ? 'winning' : 'outbid';
                } else {
                  auctionTimingStatus = 'scheduled';
                  bidStatus = 'active';
                }
              }
          }
          
          const myBid: MyBid = {
            id: bid.id,
            car_id: bid.car_id,
            amount: bid.amount,
            status: bidStatus,
            created_at: bid.created_at,
            auctionTimingStatus,
            car: {
              id: car.id,
              title: car.title || `${car.year} ${car.make} ${car.model}`,
              make: car.make,
              model: car.model,
              year: car.year,
              auction_end_time: car.auction_end_time,
              current_bid: car.current_bid || 0,
              auction_status: car.auction_status,
              reserve_price: car.reserve_price,
              awaiting_seller_decision: car.awaiting_seller_decision
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
          console.log('Bid changed:', payload);
          // Invalidate query to trigger a refetch
          queryClient.invalidateQueries({
            queryKey: queryKey,
          });
        }
      )
      .subscribe();

    // Set up realtime subscription for car status/current_bid changes
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
            console.log('Car status changed:', payload);
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
