-- Fix the update_auction_status function to properly handle auction schedule transitions
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Use the comprehensive auction status update function that handles all transitions:
  -- - start_scheduled_auctions (scheduled -> running)
  -- - complete_scheduled_auctions (running -> completed) 
  -- - close_ended_auctions (process results)
  SELECT public.manual_auction_status_update() INTO v_result;
  
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
END;
$$;