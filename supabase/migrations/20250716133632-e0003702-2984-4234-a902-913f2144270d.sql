-- Fix the auction status update function that has a bug with the "value" column
CREATE OR REPLACE FUNCTION public.update_auction_status()
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

  -- Step 2: Complete running auctions (running -> completed)
  UPDATE auction_schedules 
  SET status = 'completed',
      last_status_change = NOW(),
      updated_at = NOW()
  WHERE status = 'running' 
    AND end_time < NOW();
  
  GET DIAGNOSTICS v_completed_count = ROW_COUNT;

  -- Step 3: Update cars auction status to match schedule status
  -- Set cars to active when auction schedule becomes running
  UPDATE cars 
  SET auction_status = 'active',
      auction_scheduled = true,
      updated_at = NOW()
  WHERE id IN (
    SELECT car_id FROM auction_schedules 
    WHERE status = 'running'
  ) AND (auction_status != 'active' OR auction_scheduled = false);

  -- Set cars to ended when auction schedule becomes completed
  UPDATE cars 
  SET auction_status = 'ended',
      updated_at = NOW()
  WHERE id IN (
    SELECT car_id FROM auction_schedules 
    WHERE status = 'completed'
  ) AND auction_status != 'ended';

  -- Step 4: Process completed auctions to create won vehicle records
  SELECT public.process_ended_auctions() INTO v_processed_count;

  -- Build result
  v_result := jsonb_build_object(
    'started_auctions', v_started_count,
    'completed_auctions', v_completed_count,
    'processed_auctions', v_processed_count,
    'timestamp', NOW(),
    'success', true
  );

  -- Log the automated execution
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'automated_auction_update', 
    'Automated auction status update executed', 
    v_result
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'automated_auction_update_error', 
    'Error in update_auction_status function', 
    SQLERRM,
    jsonb_build_object('error_code', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$;

-- Now run the fixed function to update the Skoda Fabia auction
SELECT public.update_auction_status();