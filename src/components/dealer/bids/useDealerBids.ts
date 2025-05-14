
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MyBid } from "./types";
import { queryKeys } from "@/utils/queryClient";
import { isValidRecord, isSelectQueryError, safeFilter } from "@/utils/supabaseHelpers";

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

interface ProxyBidData {
  car_id: string;
  max_bid_amount: number;
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
      if (!dealerProfileId) return [];

      // Get active bids for this dealer
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

      if (bidsError) throw bidsError;
      
      if (!activeBids || activeBids.length === 0) {
        return [] as MyBid[];
      }

      // Filter to ensure we only have valid bids without errors
      const validActiveBids = activeBids.filter(bid => 
        bid !== null && 
        typeof bid === 'object' && 
        !isSelectQueryError(bid) &&
        'car_id' in bid
      );

      // Get car details for these bids
      const carIds = [...new Set(validActiveBids.map(bid => bid.car_id))];
      
      if (carIds.length === 0) {
        return [] as MyBid[];
      }
      
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
        .in("id", carIds)
        .eq("auction_status", "active");
      
      if (carsError) throw carsError;
      
      // Create a lookup table for cars
      const carsById: Record<string, CarData> = {};
      
      // Filter valid car records and populate the lookup
      if (cars && Array.isArray(cars)) {
        const validCars = cars.filter(car => 
          car !== null && 
          typeof car === 'object' &&
          !isSelectQueryError(car) &&
          'id' in car
        );
        
        validCars.forEach(car => {
          if (car && car.id) {
            carsById[car.id] = car as CarData;
          }
        });
      }

      // Get proxy bids for these cars
      const { data: proxyBidsData } = await supabase
        .from("proxy_bids")
        .select("car_id, max_bid_amount")
        .eq("dealer_id", dealerProfileId)
        .in("car_id", carIds);
        
      // Create a lookup for proxy bids
      const proxyBidsByCarId: Record<string, ProxyBidData> = {};
      
      // Filter and process valid proxy bids
      if (proxyBidsData && Array.isArray(proxyBidsData)) {
        const validProxyBids = proxyBidsData.filter(pb => 
          pb !== null && 
          typeof pb === 'object' &&
          !isSelectQueryError(pb) &&
          'car_id' in pb && 
          'max_bid_amount' in pb
        );
        
        validProxyBids.forEach(pb => {
          if (pb && pb.car_id) {
            proxyBidsByCarId[pb.car_id] = {
              car_id: pb.car_id,
              max_bid_amount: pb.max_bid_amount
            };
          }
        });
      }

      // Filter bids for active auctions only and merge with car data
      const result = validActiveBids
        .map(bid => {
          if (!bid || !bid.car_id || !carsById[bid.car_id]) {
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
          
          // Add proxy bid information if it exists
          if (bid.car_id && proxyBidsByCarId[bid.car_id]) {
            const proxyBid = proxyBidsByCarId[bid.car_id];
            if (proxyBid) {
              myBid.proxy_bid = {
                max_bid_amount: proxyBid.max_bid_amount
              };
            }
          }
          
          return myBid;
        })
        .filter((bid): bid is MyBid => bid !== null);
        
      return result;
    },
    enabled: !!dealerProfileId,
    // Refetch every 30 seconds
    refetchInterval: 30 * 1000,
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
