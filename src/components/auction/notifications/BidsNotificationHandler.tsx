import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showBidPlacedToast } from "@/utils/toastMessages";

interface BidsNotificationHandlerProps {
  carId: string;
  dealerId: string | null;
}

export const BidsNotificationHandler = ({
  carId,
  dealerId,
}: BidsNotificationHandlerProps) => {
  useEffect(() => {
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
          showBidPlacedToast(newBid.amount, newBid.dealer_id === dealerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carId, dealerId]);

  return null;
};