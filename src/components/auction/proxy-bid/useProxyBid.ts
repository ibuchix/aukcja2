
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/utils/queryClient";
import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";
import { queueProxyBid } from "@/services/offlineBidQueue";

interface UseProxyBidProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const useProxyBid = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: UseProxyBidProps) => {
  const [maxBid, setMaxBid] = useState<string>("");
  const [existingProxyBid, setExistingProxyBid] = useState<number | null>(null);
  const [isProxyBidUsed, setIsProxyBidUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [optimalBid, setOptimalBid] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        ) as PostgrestSingleResponse<{ max_bid_amount: number, last_processed_amount: number | null }>;

        if (result.error && result.error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
          throw result.error;
        }

        if (result.data) {
          setExistingProxyBid(result.data.max_bid_amount);
          setMaxBid(result.data.max_bid_amount.toString());
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
              setMaxBid(typedResponse.optimal_proxy_amount.toString());
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
  }, [carId, dealerId, currentHighestBid, isOnline]);

  const handleSetMaxBid = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const numericMaxBid = parseFloat(maxBid);
      if (isNaN(numericMaxBid)) {
        throw new Error("Please enter a valid number");
      }

      if (numericMaxBid <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of $${currentHighestBid}`);
      }

      // Check if the bid is divisible by the minimum increment
      if (numericMaxBid % minimumIncrement !== 0) {
        throw new Error(`Bid must be divisible by the minimum increment of $${minimumIncrement}`);
      }

      // If offline, queue the proxy bid
      if (!isOnline) {
        const queuedBid = queueProxyBid(carId, dealerId, currentHighestBid + minimumIncrement, numericMaxBid);
        
        // Optimistically update the UI
        setExistingProxyBid(numericMaxBid);
        
        toast({
          title: "Proxy Bid Queued",
          description: `Your maximum proxy bid of $${numericMaxBid.toLocaleString()} will be set when you're back online.`,
        });
        
        setIsSubmitting(false);
        return;
      }

      // Optimistically update the UI
      const previousProxyBid = existingProxyBid;
      setExistingProxyBid(numericMaxBid);

      // Use upsert with onConflict to handle concurrent submissions
      const result = await executeWithRetry(() => 
        supabase
          .from('proxy_bids')
          .upsert({
            car_id: carId,
            dealer_id: dealerId,
            max_bid_amount: numericMaxBid,
          }, {
            onConflict: 'car_id,dealer_id'
          })
      ) as PostgrestResponse<any>;

      if (result.error) {
        // Revert optimistic update if there's an error
        setExistingProxyBid(previousProxyBid);
        
        // Check if this is a serialization or lock timeout error
        if (result.error.message?.includes('SERIALIZATION_FAILURE') || 
            result.error.message?.includes('LOCK_TIMEOUT') ||
            result.error.message?.includes('CONCURRENT_MODIFICATION')) {
          
          if (retryCount < 3) {
            // Automatic retry with exponential backoff
            setRetryCount(prev => prev + 1);
            toast({
              title: "Bidding System Busy",
              description: "The auction is experiencing high activity. Retrying your bid...",
            });
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
            setIsSubmitting(false);
            return handleSetMaxBid();
          } else {
            throw new Error("The bidding system is very busy. Please try again in a moment.");
          }
        }
        
        throw result.error;
      }

      // Reset retry count on success
      setRetryCount(0);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.bids.status(carId, dealerId)
      });
      
      toast({
        title: "Maximum Bid Set",
        description: `Your maximum bid of $${numericMaxBid.toLocaleString()} has been set successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set maximum bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMaxBid = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      
      // If offline, show error message
      if (!isOnline) {
        throw new Error("Cannot remove proxy bid while offline. Please try again when you're online.");
      }
      
      // Optimistically update UI
      const previousProxyBid = existingProxyBid;
      setExistingProxyBid(null);
      setMaxBid("");
      setIsProxyBidUsed(false);
      
      const result = await executeWithRetry(() => 
        supabase
          .from('proxy_bids')
          .delete()
          .eq('car_id', carId)
          .eq('dealer_id', dealerId)
      ) as PostgrestResponse<any>;

      if (result.error) {
        // Revert optimistic updates on error
        setExistingProxyBid(previousProxyBid);
        setMaxBid(previousProxyBid?.toString() || "");
        throw result.error;
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.bids.status(carId, dealerId)
      });
      
      toast({
        title: "Maximum Bid Removed",
        description: "Your maximum bid has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove maximum bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to use the optimal bid suggestion
  const useOptimalBid = () => {
    if (optimalBid) {
      setMaxBid(optimalBid.toString());
    }
  };

  return {
    maxBid,
    setMaxBid,
    existingProxyBid,
    isProxyBidUsed,
    isLoading,
    isSubmitting,
    optimalBid,
    useOptimalBid,
    handleSetMaxBid,
    handleRemoveMaxBid,
    isOnline
  };
};
