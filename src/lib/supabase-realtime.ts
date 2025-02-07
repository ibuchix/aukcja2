import { supabase } from "@/integrations/supabase/client";

export const enableRealtimeForTables = async () => {
  // Create a channel for cars table
  const carsChannel = supabase.channel('cars_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cars'
      },
      (payload) => {
        console.log('Cars change received:', payload);
      }
    )
    .subscribe();

  // Create a channel for bids table with more detailed logging
  const bidsChannel = supabase.channel('bids_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bids'
      },
      (payload) => {
        console.log('Bids change received:', payload);
        // Log specific details about bid changes
        if (payload.eventType === 'INSERT') {
          console.log('New bid placed:', {
            amount: payload.new.amount,
            status: payload.new.status,
            timestamp: payload.new.created_at
          });
        } else if (payload.eventType === 'UPDATE') {
          console.log('Bid status changed:', {
            from: payload.old.status,
            to: payload.new.status,
            amount: payload.new.amount
          });
        }
      }
    )
    .subscribe();

  // Create a channel for proxy_bids table
  const proxyBidsChannel = supabase.channel('proxy_bids_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'proxy_bids'
      },
      (payload) => {
        console.log('Proxy bids change received:', payload);
        if (payload.eventType === 'UPDATE') {
          console.log('Proxy bid updated:', {
            oldAmount: payload.old.max_bid_amount,
            newAmount: payload.new.max_bid_amount
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(carsChannel);
    supabase.removeChannel(bidsChannel);
    supabase.removeChannel(proxyBidsChannel);
  };
};