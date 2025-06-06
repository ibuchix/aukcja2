
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseBidFormActionsProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  onBidPlaced?: (amount: number) => void;
}

interface UseBidFormActionsResult {
  isSubmitting: boolean;
  retryCount: number;
  handlePlaceBid: (bidAmount: string, isProxyBid?: boolean, maxProxyAmount?: number) => Promise<void>;
}

export const useBidFormActions = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  onBidPlaced,
}: UseBidFormActionsProps): UseBidFormActionsResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const handlePlaceBid = async (bidAmount: string, isProxyBid: boolean = false, maxProxyAmount?: number) => {
    try {
      setIsSubmitting(true);
      const numericBidAmount = parseFloat(bidAmount);
      
      if (isNaN(numericBidAmount)) {
        throw new Error("Please enter a valid number");
      }

      if (numericBidAmount <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of ${currentHighestBid.toLocaleString()} PLN`);
      }

      // Call the place_bid function on the server
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount,
        p_is_proxy: isProxyBid,
        p_max_proxy_amount: maxProxyAmount
      });

      if (error) {
        // Check if this is a concurrency or transaction isolation error
        if (error.message?.includes('SERIALIZATION_FAILURE') || 
            error.message?.includes('LOCK_TIMEOUT') ||
            error.message?.includes('CONCURRENT_MODIFICATION') ||
            error.message?.includes('DEADLOCK')) {
          
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
            return handlePlaceBid(bidAmount, isProxyBid, maxProxyAmount);
          } else {
            throw new Error("The auction is very active right now. Please try again in a moment.");
          }
        }
        
        throw error;
      }
      
      // Check the response data structure properly
      if (typeof data === 'object' && data !== null && 'success' in data) {
        if (!data.success) {
          throw new Error(data.error?.toString() || 'Failed to place bid');
        }

        // Reset retry count on success
        setRetryCount(0);

        toast({
          title: "Bid Placed",
          description: `Your bid of ${numericBidAmount.toLocaleString()} PLN has been placed successfully`,
        });

        // Call onBidPlaced callback if provided
        if (onBidPlaced) {
          onBidPlaced(numericBidAmount);
        }

        return;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    retryCount,
    handlePlaceBid
  };
};
