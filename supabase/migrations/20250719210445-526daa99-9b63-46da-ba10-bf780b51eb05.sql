-- Create a test function without auth requirements to verify the logic
CREATE OR REPLACE FUNCTION public.test_live_auction_schedules_no_auth()
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