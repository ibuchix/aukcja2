-- Create database-backed rate limiting table for high concurrency scenarios
CREATE TABLE IF NOT EXISTS dealer_bid_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL,
  bid_date date NOT NULL DEFAULT CURRENT_DATE,
  bid_count integer NOT NULL DEFAULT 0,
  last_bid_at timestamp with time zone DEFAULT NOW(),
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  CONSTRAINT dealer_bid_rate_limits_unique UNIQUE (dealer_id, bid_date)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_dealer_bid_rate_limits_dealer_date 
ON dealer_bid_rate_limits (dealer_id, bid_date);

-- Enable RLS
ALTER TABLE dealer_bid_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for dealer_bid_rate_limits
CREATE POLICY "Admins can manage all rate limits" ON dealer_bid_rate_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Service role can access all rate limits" ON dealer_bid_rate_limits
  FOR ALL USING (true);

-- Function to check and update bid rate limit in database
CREATE OR REPLACE FUNCTION check_dealer_bid_rate_limit(p_dealer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Enhanced place_bid function with proper rate limiting enforcement
CREATE OR REPLACE FUNCTION public.place_bid(
  p_car_id uuid,
  p_dealer_id uuid,
  p_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bid_id uuid;
  v_car cars%ROWTYPE;
  v_dealer dealers%ROWTYPE;
  v_rate_limit_response jsonb;
  v_rate_limit_allowed boolean := true;
  v_start_time timestamp := clock_timestamp();
BEGIN
  -- Log bid attempt
  INSERT INTO system_logs (log_type, message, details) 
  VALUES (
    'bid_attempt', 
    'Bid placement started',
    jsonb_build_object(
      'dealer_id', p_dealer_id,
      'car_id', p_car_id,
      'amount', p_amount,
      'timestamp', v_start_time
    )
  );

  -- Input validation
  IF p_car_id IS NULL OR p_dealer_id IS NULL OR p_amount IS NULL THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Missing required parameters', 'Input validation failed');
    RETURN jsonb_build_object('success', false, 'message', 'Missing required parameters');
  END IF;

  IF p_amount <= 0 OR p_amount > 2000000 THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Invalid bid amount', p_amount::text);
    RETURN jsonb_build_object('success', false, 'message', 'Bid amount must be between 1 and 2,000,000 PLN');
  END IF;

  -- Get car information
  SELECT * INTO v_car FROM cars WHERE id = p_car_id;
  IF NOT FOUND THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Car not found', p_car_id::text);
    RETURN jsonb_build_object('success', false, 'message', 'Car not found');
  END IF;

  -- Check if car is available for auction
  IF NOT v_car.is_auction THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Car not available for auction', p_car_id::text);
    RETURN jsonb_build_object('success', false, 'message', 'Car is not available for auction');
  END IF;

  -- Check if auction is active
  IF v_car.auction_status != 'active' OR v_car.auction_end_time < NOW() THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Auction not active', jsonb_build_object('status', v_car.auction_status, 'end_time', v_car.auction_end_time));
    RETURN jsonb_build_object('success', false, 'message', 'Auction is not currently active');
  END IF;

  -- Get dealer information and verify
  SELECT * INTO v_dealer FROM dealers WHERE id = p_dealer_id;
  IF NOT FOUND THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Dealer not found', p_dealer_id::text);
    RETURN jsonb_build_object('success', false, 'message', 'Dealer not found');
  END IF;

  IF NOT v_dealer.is_verified THEN
    INSERT INTO system_logs (log_type, message, error_message) 
    VALUES ('bid_validation_error', 'Dealer not verified', p_dealer_id::text);
    RETURN jsonb_build_object('success', false, 'message', 'Dealer is not verified');
  END IF;

  -- Database-backed rate limiting check (primary method)
  SELECT check_dealer_bid_rate_limit(p_dealer_id) INTO v_rate_limit_response;
  v_rate_limit_allowed := (v_rate_limit_response->>'allowed')::boolean;

  IF NOT v_rate_limit_allowed THEN
    INSERT INTO system_logs (log_type, message, details) 
    VALUES (
      'rate_limit_blocked', 
      'Bid blocked by database rate limiter',
      jsonb_build_object(
        'dealer_id', p_dealer_id,
        'response', v_rate_limit_response
      )
    );
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Daily bid limit exceeded (40 bids per day)',
      'rate_limit_info', v_rate_limit_response
    );
  END IF;

  -- Log successful rate limiting check
  INSERT INTO system_logs (log_type, message, details) 
  VALUES (
    'rate_limit_passed', 
    'Rate limit check passed',
    jsonb_build_object(
      'dealer_id', p_dealer_id,
      'response', v_rate_limit_response
    )
  );

  -- Mark any previous bids from this dealer as outbid
  UPDATE bids 
  SET status = 'outbid', updated_at = NOW()
  WHERE car_id = p_car_id 
    AND dealer_id = p_dealer_id 
    AND status = 'active';

  -- Insert the new bid
  INSERT INTO bids (
    id, car_id, dealer_id, amount, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_car_id, p_dealer_id, p_amount, 'active', NOW(), NOW()
  ) RETURNING id INTO v_bid_id;

  -- Update the car's current bid if this is higher
  UPDATE cars 
  SET 
    current_bid = GREATEST(COALESCE(current_bid, 0), p_amount),
    updated_at = NOW()
  WHERE id = p_car_id;

  -- Log successful bid placement
  INSERT INTO system_logs (log_type, message, details) 
  VALUES (
    'bid_placed_success', 
    'Bid placed successfully',
    jsonb_build_object(
      'bid_id', v_bid_id,
      'dealer_id', p_dealer_id,
      'car_id', p_car_id,
      'amount', p_amount,
      'processing_time_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time),
      'rate_limit_info', v_rate_limit_response
    )
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Bid placed successfully',
    'bid_id', v_bid_id,
    'amount', p_amount,
    'rate_limit_info', v_rate_limit_response
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error details
  INSERT INTO system_logs (log_type, message, error_message, details) 
  VALUES (
    'bid_placement_error', 
    'Database error in place_bid',
    SQLERRM,
    jsonb_build_object(
      'dealer_id', p_dealer_id,
      'car_id', p_car_id,
      'amount', p_amount,
      'processing_time_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)
    )
  );
  
  RETURN jsonb_build_object(
    'success', false, 
    'message', 'Database error: ' || SQLERRM
  );
END;
$$;