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
    RETURN 'active';  -- FIXED: Changed from 'running' to 'active'
  END IF;
  
  -- Check if auction is scheduled for the future (before start time)
  IF NOW() < schedule_start_time THEN
    RETURN 'scheduled';
  END IF;
  
  RETURN 'unknown';
END;
$$;