
import { supabase } from "@/integrations/supabase/client";
import { processSchedulesData } from "./scheduleDataProcessor";

export const fetchLiveAuctionSchedules = async () => {
  // Use the SECURITY DEFINER function instead of direct table access
  // This bypasses RLS while maintaining authentication security
  const { data: schedulesData, error: schedulesError } = await supabase
    .rpc('get_live_auction_schedules');
  
  if (schedulesError) {
    throw new Error(`Live schedules query failed: ${schedulesError.message}`);
  }
  
  return processSchedulesData(schedulesData || []);
};
