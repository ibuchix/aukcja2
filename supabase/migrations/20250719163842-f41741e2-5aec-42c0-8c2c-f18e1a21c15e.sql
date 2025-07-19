-- Enhanced auction status synchronization function
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_updated_cars INTEGER := 0;
  v_updated_schedules INTEGER := 0;
  v_total_updates INTEGER := 0;
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
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN v_total_updates;
END;
$function$;

-- Create a trigger to sync statuses when auction_schedules are updated
CREATE OR REPLACE FUNCTION public.sync_auction_status_on_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update the corresponding car's auction status immediately
  UPDATE public.cars
  SET 
    auction_status = CASE 
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      WHEN NEW.status = 'completed' THEN 'ended'
      WHEN NEW.status = 'active' AND NOW() >= NEW.start_time AND NOW() <= NEW.end_time THEN 'active'
      WHEN NEW.status = 'scheduled' AND NOW() < NEW.start_time THEN 'scheduled'
      WHEN NEW.status = 'active' AND NOW() > NEW.end_time THEN 'ended'
      ELSE auction_status
    END,
    auction_end_time = NEW.end_time,
    updated_at = NOW()
  WHERE id = NEW.car_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auction_schedules updates
DROP TRIGGER IF EXISTS sync_auction_status_trigger ON auction_schedules;
CREATE TRIGGER sync_auction_status_trigger
  AFTER UPDATE ON auction_schedules
  FOR EACH ROW
  EXECUTE FUNCTION sync_auction_status_on_schedule_change();