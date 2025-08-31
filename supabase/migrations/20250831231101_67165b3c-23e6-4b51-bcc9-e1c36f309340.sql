-- Fix security issue with check_dealer_bid_rate_limit function search path
CREATE OR REPLACE FUNCTION check_dealer_bid_rate_limit(p_dealer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count integer := 0;
  v_max_bids_per_day integer := 40;
  v_bid_date date := CURRENT_DATE;
  v_remaining integer;
BEGIN
  -- Get or create rate limit record
  INSERT INTO dealer_bid_rate_limits (dealer_id, bid_date, bid_count)
  VALUES (p_dealer_id, v_bid_date, 1)
  ON CONFLICT (dealer_id, bid_date) 
  DO UPDATE SET 
    bid_count = dealer_bid_rate_limits.bid_count + 1,
    last_bid_at = NOW(),
    updated_at = NOW()
  RETURNING bid_count INTO v_current_count;
  
  v_remaining := v_max_bids_per_day - v_current_count;
  
  -- Check if limit exceeded
  IF v_current_count > v_max_bids_per_day THEN
    -- Rollback the increment
    UPDATE dealer_bid_rate_limits 
    SET bid_count = bid_count - 1, updated_at = NOW()
    WHERE dealer_id = p_dealer_id AND bid_date = v_bid_date;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'current_count', v_current_count - 1,
      'remaining', 0,
      'reset_at', (v_bid_date + interval '1 day')::timestamp,
      'message', 'Daily bid limit exceeded'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'current_count', v_current_count,
    'remaining', v_remaining,
    'reset_at', (v_bid_date + interval '1 day')::timestamp,
    'message', 'Bid allowed'
  );
END;
$$;