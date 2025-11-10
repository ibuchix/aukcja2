
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { auctionStatusMonitor } from "@/utils/auctionStatusMonitor";
import { translateErrorMessage, translateToastMessage } from "@/lib/vehicleTranslations";

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
  handlePlaceBid: (bidAmount: string) => Promise<void>;
}

// Type guard for dealer data
interface ValidDealerData {
  id: string;
  user_id: string;
  dealership_name: string;
  is_verified: boolean;
  verification_status: string;
}

function isValidVerifiedDealer(data: any): data is ValidDealerData {
  return data && 
         typeof data === 'object' && 
         data !== null &&
         !('error' in data) &&
         'id' in data &&
         'is_verified' in data &&
         data.is_verified === true;
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

  const handlePlaceBid = async (bidAmount: string) => {
    try {
      setIsSubmitting(true);
      const numericBidAmount = parseFloat(bidAmount);
      
      // Enhanced debugging logs
      console.log('=== ENHANCED BID PLACEMENT DEBUG ===');
      console.log('Placing bid with params:', {
        carId,
        dealerId,
        amount: numericBidAmount,
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
        throw new Error(translateErrorMessage('Dealer profile not found. Please ensure your profile is complete.'));
      }

      // Explicit verification with type guard
      if (!isValidVerifiedDealer(dealerCheck)) {
        console.error('Dealer not verified:', dealerCheck);
        throw new Error(translateErrorMessage('Your dealer account is not verified. Please contact support.'));
      }
      
      if (isNaN(numericBidAmount)) {
        throw new Error(translateErrorMessage("Please enter a valid number"));
      }

      if (numericBidAmount <= 0) {
        throw new Error(translateErrorMessage("Bid amount must be greater than 0"));
      }

      // Removed minimum bid and current bid restrictions - dealers can bid any positive amount

      // Force status synchronization before bid placement to ensure accuracy
      console.log('Forcing auction status synchronization...');
      const syncResult = await auctionStatusMonitor.forceSynchronization();
      console.log('Synchronization result:', syncResult);

      // Call the enhanced place_bid function
      console.log('Calling enhanced place_bid RPC with parameters:', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount
      });

      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount
      });

      console.log('Enhanced bid placement response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }
      
      // Check the response data structure properly
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          // The place_bid RPC returns messages in English. data.message is primary, data.error is fallback
          const rawError = data.message || data.error || 'Failed to place bid';
          const errorMsg = translateErrorMessage(String(rawError));
          console.error('Enhanced bid placement failed:', errorMsg);
          
          // Check if it's a status-related error and suggest retry
          if (errorMsg.includes('not currently active') || errorMsg.includes('not accepting bids')) {
            console.log('Status-related error detected, verifying consistency...');
            const consistencyResult = await auctionStatusMonitor.verifyConsistency();
            console.log('Consistency verification result:', consistencyResult);
            
            // Suggest retry for status issues
            if (retryCount < 2) {
              toast({
                title: translateToastMessage("Auction Status Issue"),
                description: translateToastMessage("Auction status is being synchronized. Retrying..."),
              });
              
              setRetryCount(prev => prev + 1);
              // Wait a moment and retry
              setTimeout(() => {
                setIsSubmitting(false);
                handlePlaceBid(bidAmount);
              }, 2000);
              return;
            }
          }
          
          throw new Error(errorMsg);
        }

        console.log('Enhanced bid placed successfully:', data);

        // Reset retry count on success
        setRetryCount(0);

        toast({
          title: translateToastMessage("Bid Placed Successfully"),
          description: `Twoja oferta w wysokości ${numericBidAmount.toLocaleString()} PLN została złożona pomyślnie`,
        });

        // Call onBidPlaced callback if provided
        if (onBidPlaced) {
          onBidPlaced(numericBidAmount);
        }

        return;
      } else {
        console.error('Invalid response structure:', data);
        throw new Error(translateErrorMessage('Invalid response from server'));
      }
    } catch (error) {
      console.error('=== ENHANCED BID PLACEMENT ERROR ===');
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
          title: translateToastMessage("Bidding System Busy"),
          description: translateToastMessage("The auction is experiencing high activity. Retrying your bid..."),
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
        setIsSubmitting(false);
        return handlePlaceBid(bidAmount);
      }
      
      toast({
        title: translateToastMessage("Bid Placement Error"),
        description: errorMessage || translateErrorMessage("Failed to place bid"),
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
