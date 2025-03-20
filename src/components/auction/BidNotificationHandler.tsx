
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeBidEvents } from "@/hooks/useRealtimeBidEvents";
import { BidMonitoringFilters } from "@/components/dealer/bid-monitoring/types";

interface BidNotificationHandlerProps {
  carId: string;
  dealerId: string | null;
  currentBid: number | null;
  notificationFilter?: Partial<BidMonitoringFilters>;
}

export const BidNotificationHandler = ({
  carId,
  dealerId,
  currentBid,
  notificationFilter = {},
}: BidNotificationHandlerProps) => {
  const { toast } = useToast();
  const initialFilters: BidMonitoringFilters = {
    ...notificationFilter,
    notificationEnabled: true,
  };

  // Use our realtime bid events hook with specific filter for this car
  const { activities } = useRealtimeBidEvents({ 
    initialFilters: {
      ...initialFilters,
      // Special filter just for this component's notifications
      bidStatus: ['active', 'outbid', 'won', 'lost']
    }
  });

  // Show toast notifications for new bid events
  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = activities[0];
      
      // Only handle activities for this specific car
      if (latestActivity.carId !== carId) {
        return;
      }
      
      // Show appropriate notification based on activity type
      switch (latestActivity.type) {
        case 'new_bid':
          // If this is our bid, show a success message
          if (latestActivity.dealerId === dealerId) {
            toast({
              title: "Bid Placed Successfully",
              description: `Your bid of $${latestActivity.bidAmount} has been placed`,
              variant: "default",
            });
          } else {
            // If we had the previous highest bid, notify that we've been outbid
            if (currentBid && dealerId && latestActivity.bidAmount && latestActivity.bidAmount > currentBid) {
              toast({
                title: "You've Been Outbid!",
                description: `New highest bid is $${latestActivity.bidAmount}`,
                variant: "destructive",
              });
            } else {
              // General notification for other users
              toast({
                title: "New Bid Placed",
                description: `A new bid of $${latestActivity.bidAmount} has been placed`,
              });
            }
          }
          break;
          
        case 'outbid':
          if (latestActivity.isOwnActivity) {
            toast({
              title: "You've Been Outbid!",
              description: `Your bid on ${latestActivity.carTitle} has been outbid`,
              variant: "destructive",
            });
          }
          break;
          
        case 'won':
          if (latestActivity.isOwnActivity) {
            toast({
              title: "Auction Won!",
              description: `Congratulations! You won the auction for ${latestActivity.carTitle}`,
              variant: "default",
            });
          }
          break;
          
        case 'lost':
          if (latestActivity.isOwnActivity) {
            toast({
              title: "Auction Lost",
              description: `You did not win the auction for ${latestActivity.carTitle}`,
              variant: "destructive",
            });
          }
          break;
          
        case 'auction_ended':
          toast({
            title: "Auction Ended",
            description: `The auction for ${latestActivity.carTitle} has ended`,
          });
          break;
      }
    }
  }, [activities, carId, dealerId, currentBid, toast]);

  // This component doesn't render anything
  return null;
};
