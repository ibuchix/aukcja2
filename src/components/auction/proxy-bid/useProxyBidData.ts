
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ProxyBidData, UseProxyBidProps } from "./types";
import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";

export interface UseProxyBidDataResult {
  existingProxyBid: number | null;
  setExistingProxyBid: React.Dispatch<React.SetStateAction<number | null>>;
  isProxyBidUsed: boolean;
  setIsProxyBidUsed: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  optimalBid: number | null;
  setOptimalBid: React.Dispatch<React.SetStateAction<number | null>>;
  isOnline: boolean;
}

export const useProxyBidData = ({ 
  carId, 
  dealerId 
}: Pick<UseProxyBidProps, 'carId' | 'dealerId'>): UseProxyBidDataResult => {
  const [existingProxyBid, setExistingProxyBid] = useState<number | null>(null);
  const [isProxyBidUsed, setIsProxyBidUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [optimalBid, setOptimalBid] = useState<number | null>(null);
  const { isOnline } = useOnlineStatusContext();

  // Fetch existing proxy bid for this car
  useEffect(() => {
    const fetchProxyBid = async () => {
      if (!isOnline) {
        setIsLoading(false);
        return;
      }
      
      try {
        const result = await executeWithRetry(() => 
          supabase
            .from('proxy_bids')
            .select('max_bid_amount, last_processed_amount')
            .eq('car_id', carId)
            .eq('dealer_id', dealerId)
            .single()
        ) as PostgrestSingleResponse<ProxyBidData>;

        if (result.error && result.error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
          throw result.error;
        }

        if (result.data) {
          setExistingProxyBid(result.data.max_bid_amount);
          setIsProxyBidUsed(result.data.last_processed_amount !== null);
        }
        
        // Calculate optimal proxy bid amount based on the DB function
        try {
          const { data: optimalBidResponse, error: optimalBidError } = await supabase
            .rpc('calculate_optimal_proxy_bid', {
              p_car_id: carId,
              p_dealer_id: dealerId,
              p_max_budget: 1000000 // Set a reasonable upper limit
            });
          
          if (optimalBidError) throw optimalBidError;
          
          // Define interface to match the structure of the response
          interface OptimalBidResponse {
            success: boolean;
            optimal_proxy_amount: number;
          }
          
          // Cast to unknown first, then to our specific type
          const typedResponse = (optimalBidResponse as unknown) as OptimalBidResponse;
          
          if (typedResponse && typedResponse.success) {
            setOptimalBid(typedResponse.optimal_proxy_amount);
            
            // If no existing proxy bid, suggest the optimal amount
            if (!result.data) {
              setExistingProxyBid(null); // Keep the existing behavior but make it more explicit
            }
          }
        } catch (err) {
          console.error("Error calculating optimal proxy bid:", err);
        }
      } catch (error) {
        console.error("Error fetching proxy bid:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (carId && dealerId) {
      fetchProxyBid();
    }
  }, [carId, dealerId, isOnline]);

  return {
    existingProxyBid,
    setExistingProxyBid,
    isProxyBidUsed,
    setIsProxyBidUsed,
    isLoading,
    optimalBid,
    setOptimalBid,
    isOnline
  };
};
