
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      const response = data as any;
      
      if (response && typeof response === 'object') {
        const success = Boolean(response.success);
        const errorMessage = response.error ? String(response.error) : null;

        if (success) {
          toast({
            title: "Bid Placed",
            description: `Your bid of ${amount.toLocaleString()} PLN has been placed successfully`,
          });
          return { success: true };
        } else {
          throw new Error(errorMessage || 'Failed to place bid');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bid';
      toast({
        title: "Error",
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

      toast({
        title: "Bid Cancelled",
        description: "Your bid has been cancelled successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel bid';
      toast({
        title: "Error",
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
