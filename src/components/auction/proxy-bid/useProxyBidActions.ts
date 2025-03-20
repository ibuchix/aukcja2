
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { PostgrestResponse } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/utils/queryClient";
import { UseProxyBidProps } from "./types";

interface UseProxyBidActionsProps extends UseProxyBidProps {
  existingProxyBid: number | null;
  setExistingProxyBid: (value: number | null) => void;
  isOnline: boolean;
}

export const useProxyBidActions = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  existingProxyBid,
  setExistingProxyBid,
  isOnline
}: UseProxyBidActionsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSetMaxBid = async (numericMaxBid: number) => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      
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

      // If offline, show message but don't proceed
      if (!isOnline) {
        toast({
          title: "You're offline",
          description: "Please reconnect to the internet to set your maximum bid.",
          variant: "destructive",
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
            return handleSetMaxBid(numericMaxBid);
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

  return {
    isSubmitting,
    handleSetMaxBid,
    handleRemoveMaxBid
  };
};
