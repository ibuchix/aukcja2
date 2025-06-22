
import { supabase } from "@/integrations/supabase/client";
import { processSchedulesData } from "./scheduleDataProcessor";

export const fetchLiveAuctionSchedules = async () => {
  const { data: schedulesData, error: schedulesError } = await supabase
    .from('auction_schedules')
    .select(`
      car_id,
      status,
      start_time,
      end_time,
      is_manually_controlled
    `)
    .eq('status', 'running')
    .lte('start_time', new Date().toISOString())
    .gte('end_time', new Date().toISOString());
  
  if (schedulesError) {
    throw new Error(`Live schedules query failed: ${schedulesError.message}`);
  }
  
  return processSchedulesData(schedulesData || []);
};
