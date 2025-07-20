-- Enhance the process_missed_auctions function with additional safety checks
CREATE OR REPLACE FUNCTION public.process_missed_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_missing_records INTEGER := 0;
  v_skipped_count INTEGER := 0;
  auction_rec RECORD;
BEGIN
  -- Find cars that are sold/ended but missing dealer_won_vehicles records
  -- with additional safety checks to prevent duplicate processing
  FOR auction_rec IN (
    SELECT c.id as car_id, c.make, c.model, c.current_bid, c.auction_end_time,
           c.reserve_price, c.auction_status
    FROM cars c
    WHERE c.auction_status IN ('sold', 'ended')
      AND c.auction_end_time < NOW()
      AND c.current_bid IS NOT NULL
      AND c.current_bid >= c.reserve_price
      -- Primary check: no dealer_won_vehicles record exists
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv 
        WHERE dwv.car_id = c.id
      )
      -- Additional safety: not processed in the last 5 minutes by any function
      AND NOT EXISTS (
        SELECT 1 FROM system_logs sl 
        WHERE sl.log_type IN ('auction_processing', 'immediate_auction_processing', 'missed_auction_recovery')
          AND sl.details->>'car_id' = c.id::text
          AND sl.created_at > NOW() - INTERVAL '5 minutes'
      )
      -- Extra safety: auction ended at least 2 minutes ago to avoid race conditions
      AND c.auction_end_time < NOW() - INTERVAL '2 minutes'
  ) LOOP
    
    -- Double-check that no dealer_won_vehicles record was created since we started
    IF EXISTS (SELECT 1 FROM dealer_won_vehicles WHERE car_id = auction_rec.car_id) THEN
      v_skipped_count := v_skipped_count + 1;
      
      -- Log that we skipped it
      INSERT INTO system_logs (
        log_type, 
        message, 
        details
      ) VALUES (
        'missed_auction_skipped',
        'Skipped processing - record already exists',
        jsonb_build_object(
          'car_id', auction_rec.car_id,
          'make', auction_rec.make,
          'model', auction_rec.model,
          'reason', 'dealer_won_vehicles_record_exists'
        )
      );
      
      CONTINUE;
    END IF;
    
    -- Process the missed auction
    PERFORM public.process_specific_ended_auction(auction_rec.car_id);
    
    v_missing_records := v_missing_records + 1;
    
    -- Log the recovery
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'missed_auction_recovery',
      'Processed missed auction in backup function',
      jsonb_build_object(
        'car_id', auction_rec.car_id,
        'make', auction_rec.make,
        'model', auction_rec.model,
        'current_bid', auction_rec.current_bid,
        'auction_status', auction_rec.auction_status,
        'processed_by', 'backup_function'
      )
    );
  END LOOP;
  
  -- Log summary of backup processing
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'missed_auction_backup_summary',
    'Backup auction processing completed',
    jsonb_build_object(
      'processed_auctions', v_missing_records,
      'skipped_auctions', v_skipped_count,
      'timestamp', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_missed_auctions', v_missing_records,
    'skipped_duplicate_processing', v_skipped_count,
    'timestamp', NOW()
  );
END;
$$;

-- Also enhance the main workflow function to add processing markers
CREATE OR REPLACE FUNCTION public.process_ended_auctions_workflow()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_notification_count INTEGER := 0;
  v_dealer_processing_result jsonb;
  auction_rec RECORD;
  v_workflow_id TEXT := gen_random_uuid()::TEXT;
BEGIN
  -- Log start of workflow
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_workflow_start',
    'Starting comprehensive auction processing workflow',
    jsonb_build_object(
      'workflow_id', v_workflow_id,
      'timestamp', NOW()
    )
  );

  -- Process each ended auction that meets criteria and hasn't been processed yet
  FOR auction_rec IN (
    SELECT c.id as car_id, c.seller_id, c.auction_end_time, c.reserve_price,
           c.make, c.model, c.year, c.current_bid, c.auction_status, c.mileage, c.images
    FROM cars c
    WHERE c.auction_status IN ('ended', 'sold')
      AND c.auction_end_time < NOW()
      AND c.current_bid IS NOT NULL
      AND c.current_bid >= c.reserve_price
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv 
        WHERE dwv.car_id = c.id
      )
      -- Avoid processing auctions that are being processed right now
      AND NOT EXISTS (
        SELECT 1 FROM system_logs sl 
        WHERE sl.log_type = 'auction_processing'
          AND sl.details->>'car_id' = c.id::text
          AND sl.created_at > NOW() - INTERVAL '30 seconds'
      )
  ) LOOP
    
    -- Mark that we're processing this auction
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'auction_processing',
      'Processing ended auction in main workflow',
      jsonb_build_object(
        'car_id', auction_rec.car_id,
        'make', auction_rec.make,
        'model', auction_rec.model,
        'workflow_id', v_workflow_id
      )
    );
    
    -- Process the specific auction
    PERFORM public.process_specific_ended_auction(auction_rec.car_id);
    
    v_processed_count := v_processed_count + 1;
  END LOOP;

  -- Process dealer notifications for accepted seller decisions
  SELECT public.process_dealer_post_seller_decision() INTO v_dealer_processing_result;
  
  IF v_dealer_processing_result->>'emails_queued' IS NOT NULL THEN
    v_notification_count := (v_dealer_processing_result->>'emails_queued')::INTEGER;
  END IF;

  -- Log completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_workflow_complete',
    'Comprehensive auction processing workflow completed',
    jsonb_build_object(
      'workflow_id', v_workflow_id,
      'processed_auctions', v_processed_count,
      'notification_emails_queued', v_notification_count,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'processed_auctions', v_processed_count,
    'dealer_notifications', v_notification_count,
    'workflow_id', v_workflow_id,
    'timestamp', NOW()
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'auction_workflow_error',
    'Error in comprehensive auction workflow',
    SQLERRM,
    jsonb_build_object(
      'workflow_id', v_workflow_id,
      'error_code', SQLSTATE
    )
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'workflow_id', v_workflow_id,
    'timestamp', NOW()
  );
END;
$$;