
-- Remove the duplicate cron job that's causing email duplication
SELECT cron.unschedule('process-dealer-email-notifications');

-- Update the process_dealer_post_seller_decision function to use unified deduplication
CREATE OR REPLACE FUNCTION public.process_dealer_post_seller_decision()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_email_count INTEGER := 0;
  v_result jsonb;
  dealer_record RECORD;
BEGIN
  -- Update payment status for vehicles where seller has accepted (only recent decisions)
  UPDATE dealer_won_vehicles 
  SET payment_status = 'payment_required',
      updated_at = NOW()
  WHERE payment_status = 'awaiting_seller_decision'
    AND car_id IN (
      SELECT car_id 
      FROM seller_bid_decisions 
      WHERE decision = 'accepted'
        AND decided_at > NOW() - INTERVAL '48 hours' -- Only process recent decisions
    );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Get dealer records that need email notifications (using same log type as edge function)
  FOR dealer_record IN (
    SELECT 
      dwv.id as won_vehicle_id,
      dwv.dealer_id,
      dwv.car_id,
      dwv.winning_bid_amount,
      dwv.vehicle_make,
      dwv.vehicle_model,
      dwv.vehicle_year,
      d.dealership_name,
      p.id as user_id
    FROM dealer_won_vehicles dwv
    JOIN dealers d ON dwv.dealer_id = d.id
    JOIN profiles p ON d.user_id = p.id
    JOIN seller_bid_decisions sbd ON sbd.car_id = dwv.car_id
    WHERE dwv.payment_status = 'payment_required'
      AND sbd.decision = 'accepted'
      AND sbd.decided_at > NOW() - INTERVAL '48 hours' -- Only recent decisions
      -- Use same log type as edge function for unified deduplication
      AND NOT EXISTS (
        SELECT 1 FROM system_logs 
        WHERE log_type = 'dealer_bid_accepted_email_sent' 
          AND details->>'dealer_id' = dwv.dealer_id::text
          AND details->>'car_id' = dwv.car_id::text
      )
    LIMIT 5 -- Process max 5 at a time to avoid overwhelming
  ) LOOP
    
    -- Log that we're sending an email notification (use same log type as edge function)
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'dealer_bid_accepted_email_sent',
      'Email queued for dealer after bid acceptance',
      jsonb_build_object(
        'won_vehicle_id', dealer_record.won_vehicle_id,
        'dealer_id', dealer_record.dealer_id,
        'car_id', dealer_record.car_id,
        'dealership_name', dealer_record.dealership_name,
        'vehicle', dealer_record.vehicle_year || ' ' || dealer_record.vehicle_make || ' ' || dealer_record.vehicle_model,
        'winning_bid', dealer_record.winning_bid_amount,
        'queued_by', 'database_function'
      )
    );
    
    v_email_count := v_email_count + 1;
  END LOOP;
  
  -- Build result
  v_result := jsonb_build_object(
    'updated_payment_status_count', v_updated_count,
    'emails_queued', v_email_count,
    'timestamp', NOW(),
    'success', true
  );
  
  -- Log the operation
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'dealer_post_seller_decision_processing',
    'Processed dealer records after seller decisions',
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
    'dealer_post_seller_decision_error',
    'Error processing dealer post-seller decisions',
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

-- Clean up any duplicate email logs from the old system
DELETE FROM system_logs 
WHERE log_type = 'dealer_bid_accepted_email_queued' 
  AND created_at < NOW() - INTERVAL '24 hours';

-- Log the cleanup
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'email_duplication_fix',
  'Fixed email duplication by removing duplicate cron job and unifying deduplication system',
  jsonb_build_object(
    'removed_cron_job', 'process-dealer-email-notifications',
    'unified_log_type', 'dealer_bid_accepted_email_sent',
    'added_time_filter', '48 hours',
    'timestamp', NOW()
  )
);
