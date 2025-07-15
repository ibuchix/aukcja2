-- Create the missing manual_auction_status_update function that the cron job is trying to call
CREATE OR REPLACE FUNCTION public.manual_auction_status_update()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_processed_count INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Step 1: Start scheduled auctions (scheduled -> running)
  UPDATE auction_schedules 
  SET status = 'running',
      last_status_change = NOW(),
      updated_at = NOW()
  WHERE status = 'scheduled' 
    AND start_time <= NOW();
  
  GET DIAGNOSTICS v_started_count = ROW_COUNT;

  -- Step 2: Complete scheduled auctions (running -> completed)
  UPDATE auction_schedules 
  SET status = 'completed',
      last_status_change = NOW(),
      updated_at = NOW()
  WHERE status = 'running' 
    AND end_time < NOW();
  
  GET DIAGNOSTICS v_completed_count = ROW_COUNT;

  -- Step 3: Update cars auction status to 'ended' for completed auctions
  UPDATE cars 
  SET auction_status = 'ended',
      updated_at = NOW()
  WHERE auction_status = 'active'
    AND auction_end_time < NOW();

  -- Step 4: Process ended auctions and create won vehicle records
  SELECT public.process_ended_auctions() INTO v_processed_count;

  -- Build result
  v_result := jsonb_build_object(
    'started_auctions', v_started_count,
    'completed_auctions', v_completed_count,
    'processed_auctions', v_processed_count,
    'timestamp', NOW()
  );

  -- Log the operation
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_update', 
    'Manual auction status update completed', 
    v_result
  );

  RETURN v_result;
END;
$$;