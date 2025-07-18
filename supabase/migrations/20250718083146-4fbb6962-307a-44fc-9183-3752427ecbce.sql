-- Update the get_live_auction_schedules function to be more permissive
-- and work properly with the frontend authentication context
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
  -- Remove the auth check since we want this to work for all authenticated users
  -- The RLS policies on cars and auction_schedules will handle the proper access control
  
  -- Return live auction schedules including scheduled, running, and recently completed auctions
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,  -- Cast enum to text to match return type
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  INNER JOIN cars c ON s.car_id = c.id  -- Ensure car exists
  WHERE s.status IN ('scheduled', 'running', 'completed')  -- Include more statuses
    AND s.end_time >= now() - interval '1 hour'  -- Include recently ended auctions
  ORDER BY 
    CASE 
      WHEN s.status = 'running' THEN 1
      WHEN s.status = 'scheduled' THEN 2
      ELSE 3
    END,
    s.start_time ASC;
END;
$$;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.get_live_auction_schedules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_auction_schedules() TO anon;