import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showProxyBidToast } from "@/utils/toastMessages";

interface ProxyBidsNotificationHandlerProps {
  dealerId: string | null;
}

export const ProxyBidsNotificationHandler = ({
  dealerId,
}: ProxyBidsNotificationHandlerProps) => {
  useEffect(() => {
    const channel = supabase
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
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            showProxyBidToast(
              payload.new.max_bid_amount,
              payload.eventType === 'UPDATE'
            );
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