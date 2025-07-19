-- Create verify_auction_status_consistency function
CREATE OR REPLACE FUNCTION public.verify_auction_status_consistency()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inconsistent_count INTEGER := 0;
  v_total_checked INTEGER := 0;
  v_issues jsonb := '[]'::jsonb;
  rec RECORD;
BEGIN
  -- Check for auction schedules with invalid status based on timing
  FOR rec IN (
    SELECT 
      car_id,
      status,
      start_time,
      end_time,
      CASE 
        WHEN NOW() < start_time THEN 'scheduled'
        WHEN NOW() >= start_time AND NOW() <= end_time THEN 'running'
        WHEN NOW() > end_time THEN 'completed'
      END as expected_status
    FROM auction_schedules
    WHERE status != CASE 
      WHEN NOW() < start_time THEN 'scheduled'
      WHEN NOW() >= start_time AND NOW() <= end_time THEN 'running'
      WHEN NOW() > end_time THEN 'completed'
    END
    AND status != 'cancelled' -- Exclude manually cancelled auctions
  ) LOOP
    v_inconsistent_count := v_inconsistent_count + 1;
    v_issues := v_issues || jsonb_build_object(
      'car_id', rec.car_id,
      'current_status', rec.status,
      'expected_status', rec.expected_status,
      'start_time', rec.start_time,
      'end_time', rec.end_time
    );
  END LOOP;

  -- Get total count of auction schedules checked
  SELECT COUNT(*) INTO v_total_checked FROM auction_schedules;

  -- Log the consistency check
  INSERT INTO system_logs (
    log_type,
    message,
    details
  ) VALUES (
    'auction_consistency_check',
    'Performed auction status consistency verification',
    jsonb_build_object(
      'total_checked', v_total_checked,
      'inconsistent_count', v_inconsistent_count,
      'issues_found', v_issues
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'total_checked', v_total_checked,
    'inconsistent_count', v_inconsistent_count,
    'issues', v_issues,
    'timestamp', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO system_logs (
    log_type,
    message,
    error_message
  ) VALUES (
    'auction_consistency_check_error',
    'Error during auction status consistency check',
    SQLERRM
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$;