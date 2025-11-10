
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { translateErrorMessage } from "@/lib/vehicleTranslations";

export const useBidActions = (dealerId?: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const placeBid = async (carId: string, dealerId: string, amount: number) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: amount
      });

      if (error) {
        throw error;
      }

      // Type assertion with proper error handling
      // The place_bid RPC returns messages in English from the database.
      // We translate them here to Polish before showing to dealers.
      const response = data as any;
      
      if (response && typeof response === 'object') {
        const success = Boolean(response.success);
        const rawError = response.message || response.error || 'Failed to place bid';

        if (success) {
          // Toast: Bid Placed - Dealer successfully placed/modified a bid
          toast({
            description: `Twoja oferta w wysokości ${amount.toLocaleString()} PLN została złożona.`,
          });
          return { success: true };
        } else {
          throw new Error(translateErrorMessage(String(rawError)));
        }
      } else {
        throw new Error(translateErrorMessage('Invalid response from server'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : translateErrorMessage('Failed to place bid');
      // Toast: Error - Failed to place bid
      toast({
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelBid = async ({ carId, bidId }: { carId: string; bidId: string }) => {
    if (!dealerId) return;
    
    setIsCancelling(true);
    
    try {
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', bidId)
        .eq('dealer_id', dealerId);

      if (error) throw error;

      // Toast: Bid Cancelled - Dealer successfully cancelled their bid
      toast({
        description: "Twoja oferta została pomyślnie anulowana",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel bid';
      // Toast: Error - Failed to cancel bid
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    placeBid,
    cancelBid,
    isSubmitting,
    isCancelling,
  };
};
