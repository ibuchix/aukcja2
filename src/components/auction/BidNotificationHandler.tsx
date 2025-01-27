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
    const bidsChannel = supabase
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
              description: `Your bid of $${newBid.amount.toLocaleString()} has been placed`,
              variant: "default",
            });
          } else {
            // General notification for other users
            toast({
              title: "New Bid Placed",
              description: `A new bid of $${newBid.amount.toLocaleString()} has been placed`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to proxy bid updates
    const proxyBidsChannel = supabase
      .channel('public:proxy_bids')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proxy_bids',
          filter: `dealer_id=eq.${dealerId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            toast({
              title: "Proxy Bid Updated",
              description: `Your maximum bid has been updated to $${payload.new.max_bid_amount.toLocaleString()}`,
            });
          } else if (payload.eventType === 'INSERT') {
            toast({
              title: "Proxy Bid Set",
              description: `Your maximum bid of $${payload.new.max_bid_amount.toLocaleString()} has been set`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to bid status changes
    const bidStatusChannel = supabase
      .channel('public:bid_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${dealerId}`,
        },
        (payload) => {
          if (payload.new.status === 'winning') {
            toast({
              title: "You're Winning!",
              description: `Your bid of $${payload.new.amount.toLocaleString()} is currently winning`,
              variant: "default",
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(proxyBidsChannel);
      supabase.removeChannel(bidStatusChannel);
    };
  }, [carId, dealerId, currentBid, toast]);

  // This component doesn't render anything
  return null;
};