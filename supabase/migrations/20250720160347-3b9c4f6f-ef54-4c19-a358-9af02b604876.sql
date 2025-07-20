
-- First, let's schedule the comprehensive workflow function to run every 2 minutes
SELECT cron.unschedule('comprehensive-auction-workflow');

-- Schedule the main processing function
SELECT cron.schedule(
  'comprehensive-auction-workflow',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT public.process_ended_auctions_workflow();'
);

-- Create a backup "catch-all" function that runs every 10 minutes to process missed auctions
CREATE OR REPLACE FUNCTION public.process_missed_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_missing_records INTEGER := 0;
  auction_rec RECORD;
BEGIN
  -- Find cars that are sold/ended but missing dealer_won_vehicles records
  FOR auction_rec IN (
    SELECT c.id as car_id, c.make, c.model, c.current_bid, c.auction_end_time,
           c.reserve_price, c.auction_status
    FROM cars c
    WHERE c.auction_status IN ('sold', 'ended')
      AND c.auction_end_time < NOW()
      AND c.current_bid IS NOT NULL
      AND c.current_bid >= c.reserve_price
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv 
        WHERE dwv.car_id = c.id
      )
  ) LOOP
    
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
        'auction_status', auction_rec.auction_status
      )
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_missed_auctions', v_missing_records,
    'timestamp', NOW()
  );
END;
$$;

-- Schedule the backup function to run every 10 minutes
SELECT cron.schedule(
  'missed-auction-backup',
  '*/10 * * * *', -- Every 10 minutes
  'SELECT public.process_missed_auctions();'
);

-- Create a trigger on cars table to immediately process when auction_status changes to 'ended'
CREATE OR REPLACE FUNCTION public.handle_auction_end_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process if status changed to 'ended' and auction actually ended
  IF (OLD.auction_status IS DISTINCT FROM NEW.auction_status) 
     AND NEW.auction_status = 'ended' 
     AND NEW.auction_end_time < NOW()
     AND NEW.current_bid IS NOT NULL 
     AND NEW.current_bid >= NEW.reserve_price THEN
    
    -- Process the auction immediately
    PERFORM public.process_specific_ended_auction(NEW.id);
    
    -- Log the immediate processing
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'immediate_auction_processing',
      'Processed auction via trigger when status changed to ended',
      jsonb_build_object(
        'car_id', NEW.id,
        'make', NEW.make,
        'model', NEW.model,
        'winning_bid', NEW.current_bid
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS auction_end_processing_trigger ON cars;
CREATE TRIGGER auction_end_processing_trigger
  AFTER UPDATE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION handle_auction_end_trigger();

-- Enhance the update_auction_status function to trigger comprehensive workflow
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_cars INTEGER := 0;
  v_updated_schedules INTEGER := 0;
  v_total_updates INTEGER := 0;
  v_newly_ended_cars INTEGER := 0;
BEGIN
  -- Update cars.auction_status based on auction_schedules.status and timing
  -- First, sync with auction_schedules where they exist
  UPDATE public.cars
  SET 
    auction_status = CASE 
      WHEN as_sched.status = 'cancelled' THEN 'cancelled'
      WHEN as_sched.status = 'completed' THEN 'ended'
      WHEN as_sched.status = 'active' AND NOW() >= as_sched.start_time AND NOW() <= as_sched.end_time THEN 'active'
      WHEN as_sched.status = 'scheduled' AND NOW() < as_sched.start_time THEN 'scheduled'
      WHEN as_sched.status = 'active' AND NOW() > as_sched.end_time THEN 'ended'
      ELSE cars.auction_status
    END,
    auction_end_time = as_sched.end_time,
    updated_at = NOW()
  FROM auction_schedules as_sched
  WHERE cars.id = as_sched.car_id
    AND cars.is_auction = true
    AND (
      cars.auction_status IS DISTINCT FROM CASE 
        WHEN as_sched.status = 'cancelled' THEN 'cancelled'
        WHEN as_sched.status = 'completed' THEN 'ended'
        WHEN as_sched.status = 'active' AND NOW() >= as_sched.start_time AND NOW() <= as_sched.end_time THEN 'active'
        WHEN as_sched.status = 'scheduled' AND NOW() < as_sched.start_time THEN 'scheduled'
        WHEN as_sched.status = 'active' AND NOW() > as_sched.end_time THEN 'ended'
        ELSE cars.auction_status
      END
      OR cars.auction_end_time IS DISTINCT FROM as_sched.end_time
    );
  
  GET DIAGNOSTICS v_updated_cars = ROW_COUNT;

  -- Count newly ended cars for processing
  SELECT COUNT(*) INTO v_newly_ended_cars
  FROM cars c
  WHERE c.auction_status = 'ended'
    AND c.auction_end_time < NOW()
    AND c.current_bid IS NOT NULL
    AND c.current_bid >= c.reserve_price
    AND NOT EXISTS (
      SELECT 1 FROM dealer_won_vehicles dwv 
      WHERE dwv.car_id = c.id
    );

  -- Update auction_schedules.status based on timing for active schedules
  UPDATE public.auction_schedules
  SET 
    status = CASE 
      WHEN NOW() < start_time THEN 'scheduled'::auction_schedule_status
      WHEN NOW() >= start_time AND NOW() <= end_time THEN 'active'::auction_schedule_status
      WHEN NOW() > end_time THEN 'completed'::auction_schedule_status
      ELSE status
    END,
    last_status_change = CASE 
      WHEN status IS DISTINCT FROM CASE 
        WHEN NOW() < start_time THEN 'scheduled'::auction_schedule_status
        WHEN NOW() >= start_time AND NOW() <= end_time THEN 'active'::auction_schedule_status
        WHEN NOW() > end_time THEN 'completed'::auction_schedule_status
        ELSE status
      END THEN NOW()
      ELSE last_status_change
    END
  WHERE status IN ('scheduled', 'active')
    AND status IS DISTINCT FROM CASE 
      WHEN NOW() < start_time THEN 'scheduled'::auction_schedule_status
      WHEN NOW() >= start_time AND NOW() <= end_time THEN 'active'::auction_schedule_status
      WHEN NOW() > end_time THEN 'completed'::auction_schedule_status
      ELSE status
    END;
  
  GET DIAGNOSTICS v_updated_schedules = ROW_COUNT;

  -- For cars without auction schedules, update based on auction_end_time
  UPDATE public.cars
  SET 
    auction_status = CASE 
      WHEN auction_end_time IS NOT NULL AND NOW() > auction_end_time AND auction_status = 'active' THEN 'ended'
      ELSE auction_status
    END,
    updated_at = CASE 
      WHEN auction_end_time IS NOT NULL AND NOW() > auction_end_time AND auction_status = 'active' THEN NOW()
      ELSE updated_at
    END
  WHERE is_auction = true
    AND NOT EXISTS (SELECT 1 FROM auction_schedules WHERE car_id = cars.id)
    AND auction_end_time IS NOT NULL 
    AND NOW() > auction_end_time 
    AND auction_status = 'active';

  v_total_updates := v_updated_cars + v_updated_schedules;

  -- If we found newly ended auctions, trigger comprehensive processing
  IF v_newly_ended_cars > 0 THEN
    PERFORM public.process_ended_auctions_workflow();
    
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'auction_status_triggered_processing',
      'Triggered comprehensive workflow due to newly ended auctions',
      jsonb_build_object(
        'newly_ended_cars', v_newly_ended_cars,
        'timestamp', NOW()
      )
    );
  END IF;

  -- Log the synchronization if there were updates
  IF v_total_updates > 0 THEN
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'auction_status_sync', 
      'Synchronized auction statuses', 
      jsonb_build_object(
        'updated_cars', v_updated_cars,
        'updated_schedules', v_updated_schedules,
        'total_updates', v_total_updates,
        'newly_ended_cars', v_newly_ended_cars,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN v_total_updates;
END;
$$;

-- Create a data integrity monitoring function
CREATE OR REPLACE FUNCTION public.audit_auction_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_issues jsonb := '[]'::jsonb;
  v_issue_count INTEGER := 0;
  issue_rec RECORD;
BEGIN
  -- Find ended auctions missing dealer_won_vehicles records
  FOR issue_rec IN (
    SELECT c.id, c.make, c.model, c.current_bid, c.reserve_price, c.auction_end_time
    FROM cars c
    WHERE c.auction_status = 'ended'
      AND c.auction_end_time < NOW()
      AND c.current_bid IS NOT NULL
      AND c.current_bid >= c.reserve_price
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv WHERE dwv.car_id = c.id
      )
  ) LOOP
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing_won_vehicle_record',
      'car_id', issue_rec.id,
      'vehicle', issue_rec.make || ' ' || issue_rec.model,
      'winning_bid', issue_rec.current_bid,
      'auction_end_time', issue_rec.auction_end_time
    );
    v_issue_count := v_issue_count + 1;
  END LOOP;

  -- Find sold cars with incorrect payment status
  FOR issue_rec IN (
    SELECT dwv.id, dwv.car_id, c.make, c.model, dwv.payment_status
    FROM dealer_won_vehicles dwv
    JOIN cars c ON dwv.car_id = c.id
    JOIN seller_bid_decisions sbd ON sbd.car_id = c.id
    WHERE sbd.decision = 'accepted'
      AND dwv.payment_status != 'payment_required'
  ) LOOP
    v_issues := v_issues || jsonb_build_object(
      'type', 'incorrect_payment_status',
      'won_vehicle_id', issue_rec.id,
      'car_id', issue_rec.car_id,
      'vehicle', issue_rec.make || ' ' || issue_rec.model,
      'current_status', issue_rec.payment_status,
      'expected_status', 'payment_required'
    );
    v_issue_count := v_issue_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'issues_found', v_issue_count,
    'issues', v_issues,
    'timestamp', NOW()
  );
END;
$$;

-- Schedule integrity audit to run every hour
SELECT cron.schedule(
  'auction-data-integrity-audit',
  '0 * * * *', -- Every hour
  'SELECT public.audit_auction_data_integrity();'
);

-- Process the specific missed RENAULT ESPACE auction immediately
SELECT public.process_specific_ended_auction('9468f9f8-fe4a-4f3f-a4ba-b5e3b68ee6b5');

-- Run the missed auctions function immediately to catch any others
SELECT public.process_missed_auctions();
