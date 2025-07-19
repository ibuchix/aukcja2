
-- Fix auction status synchronization with proper enum values and enhanced error prevention
-- Drop the problematic function first
DROP FUNCTION IF EXISTS public.update_auction_status();

-- Create enum validation function to prevent future enum mismatches
CREATE OR REPLACE FUNCTION public.validate_auction_status_transition(
  p_current_status auction_schedule_status,
  p_new_status auction_schedule_status,
  p_start_time timestamptz,
  p_end_time timestamptz
) RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Log the validation attempt
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'status_validation',
    'Validating auction status transition',
    jsonb_build_object(
      'current_status', p_current_status::text,
      'new_status', p_new_status::text,
      'start_time', p_start_time,
      'end_time', p_end_time,
      'current_time', NOW()
    )
  );

  -- Valid transitions based on time and current state
  CASE p_new_status
    WHEN 'scheduled' THEN
      RETURN NOW() < p_start_time;
    WHEN 'running' THEN
      RETURN NOW() >= p_start_time AND NOW() <= p_end_time;
    WHEN 'completed' THEN
      RETURN NOW() > p_end_time OR p_current_status = 'running';
    WHEN 'cancelled' THEN
      RETURN true; -- Can always cancel
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create helper function to get the correct status based on timing
CREATE OR REPLACE FUNCTION public.get_correct_auction_status(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_current_status auction_schedule_status DEFAULT NULL
) RETURNS auction_schedule_status
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Don't change cancelled status
  IF p_current_status = 'cancelled' THEN
    RETURN 'cancelled';
  END IF;

  -- Determine status based on timing
  IF NOW() < p_start_time THEN
    RETURN 'scheduled';
  ELSIF NOW() >= p_start_time AND NOW() <= p_end_time THEN
    RETURN 'running';
  ELSE
    RETURN 'completed';
  END IF;
END;
$$;

-- Enhanced auction status synchronization function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_cars INTEGER := 0;
  v_updated_schedules INTEGER := 0;
  v_total_updates INTEGER := 0;
  v_error_count INTEGER := 0;
  v_schedule_record RECORD;
BEGIN
  -- Log start of synchronization
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_sync_start',
    'Starting enhanced auction status synchronization',
    jsonb_build_object('timestamp', NOW())
  );

  -- Update auction_schedules.status based on timing with validation
  FOR v_schedule_record IN (
    SELECT id, car_id, status, start_time, end_time
    FROM auction_schedules 
    WHERE status IN ('scheduled', 'running')
  ) LOOP
    BEGIN
      DECLARE
        v_correct_status auction_schedule_status;
        v_should_update boolean := false;
      BEGIN
        -- Get the correct status for this schedule
        v_correct_status := public.get_correct_auction_status(
          v_schedule_record.start_time,
          v_schedule_record.end_time,
          v_schedule_record.status
        );

        -- Check if update is needed and valid
        IF v_schedule_record.status IS DISTINCT FROM v_correct_status THEN
          IF public.validate_auction_status_transition(
            v_schedule_record.status,
            v_correct_status,
            v_schedule_record.start_time,
            v_schedule_record.end_time
          ) THEN
            v_should_update := true;
          END IF;
        END IF;

        -- Perform the update if needed
        IF v_should_update THEN
          UPDATE auction_schedules
          SET 
            status = v_correct_status,
            last_status_change = NOW()
          WHERE id = v_schedule_record.id;

          v_updated_schedules := v_updated_schedules + 1;

          -- Log successful status change
          INSERT INTO system_logs (
            log_type, 
            message, 
            details
          ) VALUES (
            'auction_status_change',
            'Auction schedule status updated',
            jsonb_build_object(
              'schedule_id', v_schedule_record.id,
              'car_id', v_schedule_record.car_id,
              'old_status', v_schedule_record.status::text,
              'new_status', v_correct_status::text,
              'start_time', v_schedule_record.start_time,
              'end_time', v_schedule_record.end_time
            )
          );
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      
      -- Log individual schedule errors but continue processing
      INSERT INTO system_logs (
        log_type, 
        message, 
        error_message,
        details
      ) VALUES (
        'auction_status_sync_error',
        'Error updating individual auction schedule',
        SQLERRM,
        jsonb_build_object(
          'schedule_id', v_schedule_record.id,
          'car_id', v_schedule_record.car_id,
          'current_status', v_schedule_record.status::text,
          'error_code', SQLSTATE
        )
      );
    END;
  END LOOP;

  -- Update cars.auction_status based on auction_schedules.status
  UPDATE public.cars
  SET 
    auction_status = CASE 
      WHEN as_sched.status = 'cancelled' THEN 'cancelled'
      WHEN as_sched.status = 'completed' THEN 'ended'
      WHEN as_sched.status = 'running' THEN 'active'  -- Map 'running' to 'active' for cars table
      WHEN as_sched.status = 'scheduled' THEN 'scheduled'
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
        WHEN as_sched.status = 'running' THEN 'active'
        WHEN as_sched.status = 'scheduled' THEN 'scheduled'
        ELSE cars.auction_status
      END
      OR cars.auction_end_time IS DISTINCT FROM as_sched.end_time
    );
  
  GET DIAGNOSTICS v_updated_cars = ROW_COUNT;

  -- For cars without auction schedules, update based on auction_end_time
  UPDATE public.cars
  SET 
    auction_status = 'ended',
    updated_at = NOW()
  WHERE is_auction = true
    AND NOT EXISTS (SELECT 1 FROM auction_schedules WHERE car_id = cars.id)
    AND auction_end_time IS NOT NULL 
    AND NOW() > auction_end_time 
    AND auction_status = 'active';

  v_total_updates := v_updated_cars + v_updated_schedules;

  -- Log the synchronization results
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_sync_complete',
    'Enhanced auction status synchronization completed',
    jsonb_build_object(
      'updated_cars', v_updated_cars,
      'updated_schedules', v_updated_schedules,
      'total_updates', v_total_updates,
      'error_count', v_error_count,
      'timestamp', NOW()
    )
  );

  RETURN v_total_updates;

EXCEPTION WHEN OTHERS THEN
  -- Log critical synchronization errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'auction_status_sync_critical_error',
    'Critical error in auction status synchronization',
    SQLERRM,
    jsonb_build_object(
      'error_code', SQLSTATE,
      'timestamp', NOW()
    )
  );
  
  -- Return -1 to indicate critical failure
  RETURN -1;
END;
$$;

-- Enhanced trigger function for auction schedule changes
CREATE OR REPLACE FUNCTION public.sync_auction_status_on_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_correct_status auction_schedule_status;
BEGIN
  -- Get the correct status based on timing
  v_correct_status := public.get_correct_auction_status(
    NEW.start_time,
    NEW.end_time,
    NEW.status
  );

  -- Validate the status if it's being changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.validate_auction_status_transition(
      OLD.status,
      NEW.status,
      NEW.start_time,
      NEW.end_time
    ) THEN
      -- Log invalid transition attempt
      INSERT INTO system_logs (
        log_type, 
        message, 
        details
      ) VALUES (
        'invalid_status_transition',
        'Invalid auction status transition attempted',
        jsonb_build_object(
          'schedule_id', NEW.id,
          'car_id', NEW.car_id,
          'old_status', OLD.status::text,
          'attempted_status', NEW.status::text,
          'correct_status', v_correct_status::text
        )
      );
      
      -- Correct the status
      NEW.status := v_correct_status;
    END IF;
  END IF;

  -- Update the corresponding car's auction status immediately
  UPDATE public.cars
  SET 
    auction_status = CASE 
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      WHEN NEW.status = 'completed' THEN 'ended'
      WHEN NEW.status = 'running' THEN 'active'  -- Map 'running' to 'active' for cars
      WHEN NEW.status = 'scheduled' THEN 'scheduled'
      ELSE auction_status
    END,
    auction_end_time = NEW.end_time,
    updated_at = NOW()
  WHERE id = NEW.car_id;
  
  -- Log the status change
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_schedule_trigger',
    'Auction schedule updated via trigger',
    jsonb_build_object(
      'schedule_id', NEW.id,
      'car_id', NEW.car_id,
      'old_status', OLD.status::text,
      'new_status', NEW.status::text
    )
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_auction_status_trigger ON auction_schedules;
CREATE TRIGGER sync_auction_status_trigger
  AFTER UPDATE ON auction_schedules
  FOR EACH ROW
  EXECUTE FUNCTION sync_auction_status_on_schedule_change();

-- Create function to verify auction status consistency
CREATE OR REPLACE FUNCTION public.verify_auction_status_consistency()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inconsistent_count INTEGER := 0;
  v_total_checked INTEGER := 0;
  v_fixed_count INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Check for inconsistencies between auction_schedules and current time
  SELECT COUNT(*) INTO v_inconsistent_count
  FROM auction_schedules
  WHERE (
    (status = 'scheduled' AND NOW() >= start_time) OR
    (status = 'running' AND (NOW() < start_time OR NOW() > end_time)) OR
    (status = 'completed' AND NOW() <= end_time)
  ) AND status != 'cancelled';

  SELECT COUNT(*) INTO v_total_checked
  FROM auction_schedules
  WHERE status != 'cancelled';

  -- Auto-fix inconsistencies
  UPDATE auction_schedules
  SET 
    status = public.get_correct_auction_status(start_time, end_time, status),
    last_status_change = NOW()
  WHERE (
    (status = 'scheduled' AND NOW() >= start_time) OR
    (status = 'running' AND (NOW() < start_time OR NOW() > end_time)) OR
    (status = 'completed' AND NOW() <= end_time)
  ) AND status != 'cancelled';

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;

  v_result := jsonb_build_object(
    'total_checked', v_total_checked,
    'inconsistencies_found', v_inconsistent_count,
    'automatically_fixed', v_fixed_count,
    'timestamp', NOW(),
    'success', true
  );

  -- Log the consistency check
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_consistency_check',
    'Auction status consistency verification completed',
    v_result
  );

  RETURN v_result;
END;
$$;

-- Update the cron job to use the enhanced function and add consistency checks
SELECT cron.unschedule('auction-status-sync');

-- Schedule the enhanced auction status synchronization job every 2 minutes
SELECT cron.schedule(
  'auction-status-sync',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT public.update_auction_status();'
);

-- Schedule consistency verification every 15 minutes
SELECT cron.schedule(
  'auction-consistency-check',
  '*/15 * * * *', -- Every 15 minutes
  'SELECT public.verify_auction_status_consistency();'
);

-- Log the enhanced system setup
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'enhanced_auction_system_setup',
  'Enhanced auction status management system deployed',
  jsonb_build_object(
    'features', ARRAY[
      'Status validation',
      'Error recovery',
      'Comprehensive logging',
      'Consistency checking',
      'Automated correction'
    ],
    'cron_jobs', ARRAY[
      'auction-status-sync (every 2 minutes)',
      'auction-consistency-check (every 15 minutes)'
    ],
    'timestamp', NOW()
  )
);
