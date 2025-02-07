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

  // Create a channel for bids table
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
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(carsChannel);
    supabase.removeChannel(bidsChannel);
  };
};