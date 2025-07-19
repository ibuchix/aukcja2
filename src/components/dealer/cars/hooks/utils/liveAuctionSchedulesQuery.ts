
import { supabase } from "@/integrations/supabase/client";
import { processSchedulesData } from "./scheduleDataProcessor";

export const fetchLiveAuctionSchedules = async () => {
  console.log('🔍 [LIVE AUCTION SCHEDULES QUERY] Fetching schedules...');
  
  // Use the SECURITY DEFINER function instead of direct table access
  // This bypasses RLS while maintaining authentication security
  const { data: schedulesData, error: schedulesError } = await supabase
    .rpc('get_live_auction_schedules' as any);
  
  if (schedulesError) {
    console.error('❌ [LIVE AUCTION SCHEDULES ERROR]', schedulesError);
    throw new Error(`Live schedules query failed: ${schedulesError.message}`);
  }
  
  console.log('📋 [RAW SCHEDULES DATA]', {
    dataCount: schedulesData?.length || 0,
    sampleData: schedulesData?.slice(0, 2)
  });
  
  // Ensure we have an array to process
  const dataArray = Array.isArray(schedulesData) ? schedulesData : [];
  
  const processedSchedules = processSchedulesData(dataArray);
  
  console.log('✅ [PROCESSED SCHEDULES]', {
    processedCount: processedSchedules.length,
    statuses: processedSchedules.map(s => ({ id: s.car_id, status: s.status, start: s.start_time, end: s.end_time }))
  });
  
  return processedSchedules;
};
