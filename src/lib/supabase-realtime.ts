import { supabase } from "@/integrations/supabase/client";

export const enableRealtimeForTables = async () => {
  // Enable realtime for cars table
  await supabase.rpc('enable_realtime', {
    table_name: 'cars'
  });

  // Enable realtime for bids table
  await supabase.rpc('enable_realtime', {
    table_name: 'bids'
  });
};