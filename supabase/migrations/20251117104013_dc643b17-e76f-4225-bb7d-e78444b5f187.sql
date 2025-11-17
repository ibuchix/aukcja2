-- Update get_live_auction_schedules function to sort by created_at DESC
-- This ensures most recently scheduled cars appear first
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
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  INNER JOIN cars c ON s.car_id = c.id
  WHERE s.status IN ('scheduled', 'active', 'completed')
    AND s.end_time >= now() - interval '1 hour'
  ORDER BY 
    CASE 
      WHEN s.status = 'active' THEN 1
      WHEN s.status = 'scheduled' THEN 2
      ELSE 3
    END,
    s.created_at DESC;  -- Most recently scheduled cars first
END;
$$;