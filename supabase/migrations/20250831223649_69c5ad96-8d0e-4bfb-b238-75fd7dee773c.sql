-- Update place_bid function to integrate with bid rate limiter
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
  v_auction_schedule auction_schedule%ROWTYPE;
  v_bid_id uuid;
  v_car cars%ROWTYPE;
  v_dealer dealers%ROWTYPE;
  v_rate_limit_response jsonb;
BEGIN
  -- Input validation
  IF p_car_id IS NULL OR p_dealer_id IS NULL OR p_amount IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Missing required parameters');
  END IF;

  IF p_amount <= 0 OR p_amount > 2000000 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Bid amount must be between 1 and 2,000,000 PLN');
  END IF;

  -- Get car information
  SELECT * INTO v_car FROM cars WHERE id = p_car_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Car not found');
  END IF;

  -- Check if car is available for auction
  IF NOT v_car.is_auction THEN
    RETURN jsonb_build_object('success', false, 'message', 'Car is not available for auction');
  END IF;

  -- Get dealer information and verify
  SELECT * INTO v_dealer FROM dealers WHERE id = p_dealer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dealer not found');
  END IF;

  IF NOT v_dealer.is_verified THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dealer is not verified');
  END IF;

  -- Check auction schedule
  SELECT * INTO v_auction_schedule 
  FROM auction_schedule 
  WHERE car_id = p_car_id 
    AND status = 'active'
    AND start_time <= NOW() 
    AND end_time >= NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auction is not currently active');
  END IF;

  -- Check bid rate limit via edge function
  BEGIN
    SELECT net.http_post(
      url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/bid-rate-limiter',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
      body := jsonb_build_object('dealerId', p_dealer_id::text)
    )->'content'::text::jsonb INTO v_rate_limit_response;

    -- Check if rate limit exceeded
    IF v_rate_limit_response->>'allowed' = 'false' THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Daily bid limit exceeded (40 bids per day)',
        'retryAfter', v_rate_limit_response->>'retryAfter',
        'remaining', v_rate_limit_response->>'remaining'
      );
    END IF;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Rate limiter failed - log and continue (fail open)
      INSERT INTO system_logs (log_type, message, error_message) 
      VALUES ('rate_limit_error', 'Bid rate limiter failed', SQLERRM);
  END;

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

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Bid placed successfully',
    'bid_id', v_bid_id,
    'amount', p_amount,
    'remaining_bids', COALESCE(v_rate_limit_response->>'remaining', 39)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'message', 'Database error: ' || SQLERRM
  );
END;
$$;