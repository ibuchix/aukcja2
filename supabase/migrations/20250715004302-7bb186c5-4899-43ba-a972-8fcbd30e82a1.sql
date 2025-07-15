-- Fix the update_auction_status function to use existing simpler functions
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transitioned_count INTEGER := 0;
  v_processed_count INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Step 1: Transition ended auctions (active -> ended)
  SELECT public.transition_ended_auctions() INTO v_transitioned_count;
  
  -- Step 2: Process ended auctions to create won vehicle records
  SELECT public.process_ended_auctions() INTO v_processed_count;
  
  -- Build result
  v_result := jsonb_build_object(
    'transitioned_auctions', v_transitioned_count,
    'processed_auctions', v_processed_count,
    'timestamp', NOW()
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
END;
$$;