-- Fix get_live_auction_schedules function to use 'active' instead of 'running'
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
  
  -- Return live auction schedules - FIXED to use 'active' instead of 'running'
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,  -- Cast enum to text to match return type
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  INNER JOIN cars c ON s.car_id = c.id  -- Ensure car exists
  WHERE s.status IN ('scheduled', 'active', 'completed')  -- FIXED: 'running' -> 'active'
    AND s.end_time >= now() - interval '1 hour'  -- Include recently ended auctions
  ORDER BY 
    CASE 
      WHEN s.status = 'active' THEN 1     -- FIXED: 'running' -> 'active'
      WHEN s.status = 'scheduled' THEN 2
      ELSE 3
    END,
    s.start_time ASC;
END;
$$;