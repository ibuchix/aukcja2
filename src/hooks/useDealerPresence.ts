import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentDealerProfile } from './useCurrentDealerProfile';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Silent background hook to track dealer online presence
 * No console logs, no UI - completely invisible to dealers
 * Monitored from Admin dashboard only
 */
export const useDealerPresence = () => {
  const { dealerProfile, isLoading } = useCurrentDealerProfile();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const trackingRef = useRef(false);

  useEffect(() => {
    // Only track if we have a valid dealer profile and not already tracking
    if (!dealerProfile || isLoading || trackingRef.current) {
      return;
    }

    // Create unique channel for dealer presence
    const channel = supabase.channel('dealer_presence', {
      config: {
        presence: {
          key: dealerProfile.id,
        },
      },
    });

    // Subscribe and track presence silently
    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence synced - no action needed
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            // Track dealer presence with essential data
            const presenceData = {
              dealer_id: dealerProfile.id,
              user_id: dealerProfile.user_id,
              dealership_name: dealerProfile.dealership_name,
              supervisor_name: dealerProfile.supervisor_name,
              online_at: new Date().toISOString(),
              is_verified: dealerProfile.is_verified,
            };

            await channel.track(presenceData);
            trackingRef.current = true;
          } catch (error) {
            // Silent fail - don't block app functionality
            trackingRef.current = false;
          }
        }
      });

    channelRef.current = channel;

    // Cleanup function - runs when component unmounts or dealer logs out
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      trackingRef.current = false;
    };
  }, [dealerProfile, isLoading]);

  return null;
};
