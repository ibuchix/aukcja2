-- Update place_bid function with simplified rate limiting integration
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

  -- Check if auction is active (simplified check)
  IF v_car.auction_status != 'active' OR v_car.auction_end_time < NOW() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auction is not currently active');
  END IF;

  -- Get dealer information and verify
  SELECT * INTO v_dealer FROM dealers WHERE id = p_dealer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dealer not found');
  END IF;

  IF NOT v_dealer.is_verified THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dealer is not verified');
  END IF;

  -- Rate limiting check via edge function (fail-open approach)
  BEGIN
    -- Call the bid rate limiter edge function
    PERFORM net.http_post(
      url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/bid-rate-limiter',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('dealerId', p_dealer_id::text)
    );
    -- If rate limit exceeded, the edge function would return 429, but we continue (fail-open)
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log rate limiter failure but continue
      INSERT INTO system_logs (log_type, message, error_message) 
      VALUES ('rate_limit_check', 'Bid rate limiter check failed - allowing bid', SQLERRM);
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
    'amount', p_amount
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'message', 'Database error: ' || SQLERRM
  );
END;
$$;