import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BidNotificationHandlerProps {
  carId: string;
  dealerId: string | null;
  currentBid: number | null;
}

export const BidNotificationHandler = ({
  carId,
  dealerId,
  currentBid,
}: BidNotificationHandlerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to new bids
    const channel = supabase
      .channel('public:bids')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=eq.${carId}`,
        },
        (payload) => {
          const newBid = payload.new;
          
          // If this is our bid, show a success message
          if (newBid.dealer_id === dealerId) {
            toast({
              title: "Bid Placed Successfully",
              description: `Your bid of $${newBid.amount} has been placed`,
              variant: "default",
            });
          } else {
            // If we had the previous highest bid, notify that we've been outbid
            if (currentBid && dealerId && newBid.amount > currentBid) {
              toast({
                title: "You've Been Outbid!",
                description: `New highest bid is $${newBid.amount}`,
                variant: "destructive",
              });
            } else {
              // General notification for other users
              toast({
                title: "New Bid Placed",
                description: `A new bid of $${newBid.amount} has been placed`,
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [carId, dealerId, currentBid, toast]);

  // This component doesn't render anything
  return null;
};