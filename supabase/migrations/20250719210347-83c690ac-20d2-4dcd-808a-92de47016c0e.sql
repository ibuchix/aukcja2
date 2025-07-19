
-- Update get_live_auction_schedules function to use 'active' instead of 'running'
CREATE OR REPLACE FUNCTION public.get_live_auction_schedules()
RETURNS TABLE (
  car_id uuid,
  status text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_manually_controlled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Return live auction schedules - using 'active' instead of 'running'
  -- Include both 'scheduled' and 'active' statuses
  -- Filter by time to include:
  -- 1. Currently active auctions (between start and end time)
  -- 2. Scheduled auctions starting within next 24 hours
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,  -- Cast enum to text to match return type
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  WHERE s.status IN ('scheduled', 'active')
    AND (
      -- Currently active auctions (between start and end time)
      (s.start_time <= now() AND s.end_time >= now())
      OR
      -- Scheduled auctions starting within the next 24 hours
      (s.status = 'scheduled' AND s.start_time > now() AND s.start_time <= now() + interval '24 hours')
    )
  ORDER BY 
    -- Prioritize active auctions first, then by start time
    CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
    s.start_time ASC;
END;
$$;

-- Update get_auction_timing_status function to return 'active' instead of 'running'
CREATE OR REPLACE FUNCTION public.get_auction_timing_status(schedule_start_time timestamp with time zone, schedule_end_time timestamp with time zone, schedule_status text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $$
BEGIN
  -- Return 'unknown' if required times are missing
  IF schedule_start_time IS NULL OR schedule_end_time IS NULL THEN
    RETURN 'unknown';
  END IF;

  -- Check if auction has ended (past end time)
  IF NOW() > schedule_end_time THEN
    RETURN 'ended';
  END IF;
  
  -- Check if auction is currently active (between start and end time)
  IF NOW() >= schedule_start_time AND NOW() <= schedule_end_time THEN
    RETURN 'active';  -- Changed from 'running' to 'active'
  END IF;
  
  -- Check if auction is scheduled for the future (before start time)
  IF NOW() < schedule_start_time THEN
    RETURN 'scheduled';
  END IF;
  
  RETURN 'unknown';
END;
$$;

-- Update update_auction_status function to use 'active' consistently
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Start scheduled auctions (scheduled -> active)
  UPDATE auction_schedules
  SET 
    status = 'active'::auction_schedule_status,
    last_status_change = NOW()
  WHERE status = 'scheduled'::auction_schedule_status
    AND start_time <= NOW()
    AND end_time > NOW();
    
  GET DIAGNOSTICS v_started_count = ROW_COUNT;
  
  -- Complete active auctions (active -> completed) 
  UPDATE auction_schedules
  SET 
    status = 'completed'::auction_schedule_status,
    last_status_change = NOW()
  WHERE status = 'active'::auction_schedule_status
    AND end_time <= NOW();
    
  GET DIAGNOSTICS v_completed_count = ROW_COUNT;
  
  -- Update corresponding cars table
  UPDATE cars 
  SET 
    auction_status = 'active',
    updated_at = NOW()
  WHERE id IN (
    SELECT car_id 
    FROM auction_schedules 
    WHERE status = 'active'::auction_schedule_status
  );
  
  UPDATE cars 
  SET 
    auction_status = 'ended',
    updated_at = NOW()
  WHERE id IN (
    SELECT car_id 
    FROM auction_schedules 
    WHERE status = 'completed'::auction_schedule_status
  );
  
  -- Build result
  v_result := jsonb_build_object(
    'started_auctions', v_started_count,
    'completed_auctions', v_completed_count,
    'timestamp', NOW(),
    'status', 'success'
  );
  
  -- Log the update
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_update', 
    'Auction status update completed', 
    v_result
  );
  
  RETURN v_result;
END;
$$;

-- Create a simple function to verify current auction schedules
CREATE OR REPLACE FUNCTION public.debug_auction_schedules()
RETURNS TABLE (
  car_id uuid,
  status text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  time_based_status text,
  is_currently_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,
    s.start_time,
    s.end_time,
    CASE 
      WHEN NOW() > s.end_time THEN 'ended'
      WHEN NOW() >= s.start_time AND NOW() <= s.end_time THEN 'active'
      WHEN NOW() < s.start_time THEN 'scheduled'
      ELSE 'unknown'
    END as time_based_status,
    (NOW() >= s.start_time AND NOW() <= s.end_time) as is_currently_active
  FROM auction_schedules s
  ORDER BY s.start_time ASC;
END;
$$;
