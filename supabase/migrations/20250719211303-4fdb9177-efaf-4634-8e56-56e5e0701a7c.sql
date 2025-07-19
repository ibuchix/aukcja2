-- Update get_correct_auction_status function to return 'active' instead of 'running'
CREATE OR REPLACE FUNCTION public.get_correct_auction_status(p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_current_status auction_schedule_status DEFAULT NULL::auction_schedule_status)
 RETURNS auction_schedule_status
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
    RETURN 'active';  -- FIXED: Changed from 'running' to 'active'
  ELSE
    RETURN 'completed';
  END IF;
END;
$$;