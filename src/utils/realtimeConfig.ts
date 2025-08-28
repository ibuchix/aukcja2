/**
 * Utility to safely handle realtime subscriptions with error handling
 */

import { supabase } from "@/integrations/supabase/client";

export interface SafeRealtimeOptions {
  channelName: string;
  event: string;
  schema: string;
  table: string;
  filter?: string;
  onEvent?: (payload: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Creates a safe realtime subscription with error handling
 * Returns null if realtime is not available or fails
 */
export const createSafeRealtimeSubscription = (options: SafeRealtimeOptions) => {
  try {
    // Check if we're in a secure context
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.warn('Realtime subscriptions disabled: Not in secure context');
      return null;
    }

    const channel = supabase.channel(options.channelName);
    
    const subscription = channel.on(
      'postgres_changes',
      {
        event: options.event as any,
        schema: options.schema,
        table: options.table,
        filter: options.filter
      },
      (payload) => {
        try {
          options.onEvent?.(payload);
        } catch (error) {
          console.error('Error in realtime event handler:', error);
          options.onError?.(error as Error);
        }
      }
    );

    // Subscribe with error handling
    subscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime subscription active: ${options.channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Realtime subscription error: ${options.channelName}`);
        options.onError?.(new Error('Channel subscription failed'));
      }
    });

    return {
      channel,
      unsubscribe: () => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error unsubscribing from realtime:', error);
        }
      }
    };
  } catch (error) {
    console.error('Failed to create realtime subscription:', error);
    options.onError?.(error as Error);
    return null;
  }
};

/**
 * Check if realtime is available and working
 */
export const isRealtimeAvailable = (): boolean => {
  try {
    // Check for WebSocket support
    if (typeof WebSocket === 'undefined') {
      return false;
    }

    // Check for secure context
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};