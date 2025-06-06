
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/utils/queryClient";

export function useBidActions(dealerProfileId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelBidMutation = useMutation({
    mutationFn: async ({ carId, bidId }: { carId: string; bidId: string }) => {
      console.log('=== CANCELLING BID ===');
      console.log('Cancelling bid:', { carId, bidId, dealerProfileId });

      // Delete the bid record
      const { error } = await supabase
        .from("bids")
        .delete()
        .eq("car_id", carId)
        .eq("dealer_id", dealerProfileId);

      if (error) {
        console.error('Error deleting bid:', error);
        throw error;
      }

      // Also delete any proxy bids for this car
      const { error: proxyError } = await supabase
        .from("proxy_bids")
        .delete()
        .eq("car_id", carId)
        .eq("dealer_id", dealerProfileId);

      if (proxyError) {
        console.warn('Error deleting proxy bid (may not exist):', proxyError);
        // Don't throw error for proxy bid deletion failure
      }

      console.log('Bid cancelled successfully');
      return { carId, bidId };
    },
    onSuccess: (data) => {
      console.log('Bid cancelled successfully:', data);
      
      toast({
        title: "Bid Cancelled",
        description: "Your bid has been successfully cancelled.",
      });
      
      // Invalidate bid queries to refresh the data
      if (dealerProfileId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bids.dealerBids(dealerProfileId),
        });
        
        // Also invalidate general bid queries
        queryClient.invalidateQueries({
          queryKey: ['myBids'],
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to cancel bid:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to cancel bid",
        variant: "destructive",
      });
    },
  });

  const modifyBidMutation = useMutation({
    mutationFn: async ({ 
      carId, 
      bidId, 
      newAmount, 
      isProxyBid = false, 
      maxProxyAmount 
    }: { 
      carId: string; 
      bidId: string; 
      newAmount: number; 
      isProxyBid?: boolean;
      maxProxyAmount?: number;
    }) => {
      console.log('=== MODIFYING BID ===');
      console.log('Modifying bid:', { carId, bidId, newAmount, isProxyBid, maxProxyAmount, dealerProfileId });

      // Use the place_bid function to update the bid
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerProfileId,
        p_amount: newAmount,
        p_is_proxy: isProxyBid,
        p_max_proxy_amount: maxProxyAmount
      });

      console.log('Modify bid response:', { data, error });

      if (error) {
        console.error('Error modifying bid:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update bid');
      }

      console.log('Bid modified successfully');
      return { carId, bidId, newAmount };
    },
    onSuccess: (data) => {
      console.log('Bid modified successfully:', data);
      
      toast({
        title: "Bid Updated",
        description: `Your bid has been updated to ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'PLN'
        }).format(data.newAmount)}.`,
      });
      
      // Invalidate bid queries to refresh the data
      if (dealerProfileId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bids.dealerBids(dealerProfileId),
        });
        
        // Also invalidate general bid queries
        queryClient.invalidateQueries({
          queryKey: ['myBids'],
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to modify bid:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update bid",
        variant: "destructive",
      });
    },
  });

  return {
    cancelBid: cancelBidMutation.mutate,
    modifyBid: modifyBidMutation.mutate,
    isCancelling: cancelBidMutation.isPending,
    isModifying: modifyBidMutation.isPending,
  };
}
