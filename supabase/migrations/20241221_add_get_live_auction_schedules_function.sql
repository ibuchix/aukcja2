
-- Create a function to get live auction schedules with SECURITY DEFINER
-- This bypasses RLS issues while still requiring authentication
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
  
  -- Return live auction schedules
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status,
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  WHERE s.status = 'running'
    AND s.start_time <= now()
    AND s.end_time >= now()
  ORDER BY s.start_time DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_live_auction_schedules() TO authenticated;
