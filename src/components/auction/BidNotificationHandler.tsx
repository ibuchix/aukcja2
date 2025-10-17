
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
            // Toast: Bid Placed Successfully - User's bid was placed
            toast({
              description: `Twoja oferta w wysokości ${latestActivity.bidAmount} zł została złożona`,
              variant: "default",
            });
          } else {
            // If we had the previous highest bid, notify that we've been outbid
            if (currentBid && dealerId && latestActivity.bidAmount && latestActivity.bidAmount > currentBid) {
              // Toast: You've Been Outbid - Someone placed a higher bid
              toast({
                description: `Nowa najwyższa oferta wynosi ${latestActivity.bidAmount} zł`,
                variant: "destructive",
              });
            } else {
              // Toast: New Bid Placed - Another dealer placed a bid
              toast({
                description: `Złożono nową ofertę w wysokości ${latestActivity.bidAmount} zł`,
              });
            }
          }
          break;
          
        case 'outbid':
          if (latestActivity.isOwnActivity) {
            // Toast: You've Been Outbid - User's bid was outbid on a specific car
            toast({
              description: `Twoja oferta na ${latestActivity.carTitle} została przebita`,
              variant: "destructive",
            });
          }
          break;
          
        case 'won':
          if (latestActivity.isOwnActivity) {
            // Toast: Auction Won - User won the auction
            toast({
              description: `Gratulacje! Wygrałeś aukcję ${latestActivity.carTitle}`,
              variant: "default",
            });
          }
          break;
          
        case 'lost':
          if (latestActivity.isOwnActivity) {
            // Toast: Auction Lost - User did not win the auction
            toast({
              description: `Nie wygrałeś aukcji ${latestActivity.carTitle}`,
              variant: "destructive",
            });
          }
          break;
          
        case 'auction_ended':
          // Toast: Auction Ended - Auction has ended
          toast({
            description: `Aukcja ${latestActivity.carTitle} została zakończona`,
          });
          break;
      }
    }
  }, [activities, carId, dealerId, currentBid, toast]);

  // This component doesn't render anything
  return null;
};
