-- Update the place_bid function to always mark previous bids from the same dealer as outbid
-- This fixes the issue where multiple active bids exist for the same dealer on the same car

CREATE OR REPLACE FUNCTION public.place_bid(
  p_car_id uuid,
  p_dealer_id uuid,
  p_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_bid numeric;
  v_reserve_price numeric;
  v_auction_end_time timestamptz;
  v_auction_status text;
  v_minimum_increment numeric;
  v_new_bid_id uuid;
BEGIN
  -- Get current auction details
  SELECT 
    current_bid,
    reserve_price,
    auction_end_time,
    auction_status,
    minimum_bid_increment
  INTO 
    v_current_bid,
    v_reserve_price,
    v_auction_end_time,
    v_auction_status,
    v_minimum_increment
  FROM cars
  WHERE id = p_car_id;

  -- Validate auction is active and not ended
  IF v_auction_status != 'active' OR v_auction_end_time < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Auction is not active or has ended'
    );
  END IF;

  -- Validate bid amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bid amount must be positive'
    );
  END IF;

  -- Always mark previous bids from this dealer as 'outbid' regardless of amount
  UPDATE bids 
  SET status = 'outbid'
  WHERE car_id = p_car_id 
    AND dealer_id = p_dealer_id 
    AND status = 'active';

  -- Insert the new bid
  INSERT INTO bids (car_id, dealer_id, amount, status)
  VALUES (p_car_id, p_dealer_id, p_amount, 'active')
  RETURNING id INTO v_new_bid_id;

  -- Update car's current_bid only if this bid is higher than existing
  -- This ensures the car tracks the highest bid across all dealers
  IF p_amount > v_current_bid THEN
    UPDATE cars 
    SET current_bid = p_amount,
        updated_at = NOW()
    WHERE id = p_car_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_new_bid_id,
    'message', 'Bid placed successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;