import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showWinningBidToast } from "@/utils/toastMessages";

interface BidStatusNotificationHandlerProps {
  dealerId: string | null;
}

export const BidStatusNotificationHandler = ({
  dealerId,
}: BidStatusNotificationHandlerProps) => {
  useEffect(() => {
    const channel = supabase
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
            showWinningBidToast(payload.new.amount);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerId]);

  return null;
};