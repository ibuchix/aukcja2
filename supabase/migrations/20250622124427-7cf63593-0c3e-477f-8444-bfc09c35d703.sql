
-- Create a function to get live auction schedules with SECURITY DEFINER
-- This bypasses RLS issues while still requiring authentication
-- Updated to include both 'scheduled' and 'running' auctions
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
  
  -- Return live auction schedules with proper enum to text casting
  -- Include both 'scheduled' and 'running' statuses
  -- Filter by time to include:
  -- 1. Currently running auctions (between start and end time)
  -- 2. Scheduled auctions starting within next 24 hours
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,  -- Cast enum to text to match return type
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  WHERE s.status IN ('scheduled', 'running')
    AND (
      -- Currently active auctions (between start and end time)
      (s.start_time <= now() AND s.end_time >= now())
      OR
      -- Scheduled auctions starting within the next 24 hours
      (s.status = 'scheduled' AND s.start_time > now() AND s.start_time <= now() + interval '24 hours')
    )
  ORDER BY s.start_time ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_live_auction_schedules() TO authenticated;
