
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
      
      // Enhanced debugging logs
      console.log('=== BID PLACEMENT DEBUG ===');
      console.log('Placing bid with params:', {
        carId,
        dealerId,
        amount: numericBidAmount,
        isProxyBid,
        maxProxyAmount,
        currentHighestBid,
        minimumIncrement
      });

      // Verify dealer exists in database
      const { data: dealerCheck, error: dealerError } = await supabase
        .from('dealers')
        .select('id, user_id, dealership_name, is_verified, verification_status')
        .eq('id', dealerId)
        .single();

      console.log('Dealer verification check:', { dealerCheck, dealerError });

      if (dealerError || !dealerCheck) {
        console.error('Dealer not found in database:', dealerError);
        throw new Error('Dealer profile not found. Please ensure your profile is complete.');
      }

      if (!dealerCheck.is_verified) {
        console.error('Dealer not verified:', dealerCheck);
        throw new Error('Your dealer account is not verified. Please contact support.');
      }
      
      if (isNaN(numericBidAmount)) {
        throw new Error("Please enter a valid number");
      }

      if (numericBidAmount <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of ${currentHighestBid.toLocaleString()} PLN`);
      }

      // Call the place_bid function on the server with explicit parameter names
      console.log('Calling place_bid RPC with parameters:', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount,
        p_is_proxy: isProxyBid,
        p_max_proxy_amount: maxProxyAmount
      });

      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount,
        p_is_proxy: isProxyBid,
        p_max_proxy_amount: maxProxyAmount
      });

      console.log('Bid placement response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }
      
      // Check the response data structure properly
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          console.error('Bid placement failed:', data.error);
          throw new Error(data.error || 'Failed to place bid');
        }

        console.log('Bid placed successfully:', data);

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
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('=== BID PLACEMENT ERROR ===');
      console.error('Error details:', error);
      
      // Check if this is a retryable error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = errorMessage.includes('SERIALIZATION_FAILURE') || 
                         errorMessage.includes('LOCK_TIMEOUT') ||
                         errorMessage.includes('CONCURRENT_MODIFICATION') ||
                         errorMessage.includes('DEADLOCK');
      
      if (isRetryable && retryCount < 3) {
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
      }
      
      toast({
        title: "Error",
        description: errorMessage || "Failed to place bid",
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
