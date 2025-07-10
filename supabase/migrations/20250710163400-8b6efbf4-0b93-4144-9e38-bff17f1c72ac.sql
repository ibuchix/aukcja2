-- Update the place_bid function to accept all bids regardless of amount
CREATE OR REPLACE FUNCTION public.place_bid(
  p_car_id uuid, 
  p_dealer_id uuid, 
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_car RECORD;
  v_dealer RECORD;
  v_auction_schedule RECORD;
  v_existing_bid RECORD;
  v_bid_id uuid;
BEGIN
  -- Validate dealer exists and is verified
  SELECT * INTO v_dealer
  FROM dealers
  WHERE id = p_dealer_id AND is_verified = true;
  
  IF v_dealer.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Dealer not found or not verified'
    );
  END IF;
  
  -- Get car details
  SELECT * INTO v_car
  FROM cars
  WHERE id = p_car_id;
  
  IF v_car.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Car not found'
    );
  END IF;
  
  -- Check if auction is scheduled and running
  SELECT * INTO v_auction_schedule
  FROM auction_schedules
  WHERE car_id = p_car_id 
    AND status = 'running'
    AND start_time <= NOW()
    AND end_time > NOW();
  
  IF v_auction_schedule.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Auction is not currently active'
    );
  END IF;
  
  -- Remove bid amount validation - accept any positive amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bid amount must be greater than 0'
    );
  END IF;
  
  -- Check for existing bid from this dealer
  SELECT * INTO v_existing_bid
  FROM bids
  WHERE car_id = p_car_id AND dealer_id = p_dealer_id;
  
  IF v_existing_bid.id IS NOT NULL THEN
    -- Update existing bid
    UPDATE bids
    SET amount = p_amount,
        updated_at = NOW(),
        status = 'active'
    WHERE id = v_existing_bid.id
    RETURNING id INTO v_bid_id;
  ELSE
    -- Create new bid
    INSERT INTO bids (car_id, dealer_id, amount, status)
    VALUES (p_car_id, p_dealer_id, p_amount, 'active')
    RETURNING id INTO v_bid_id;
  END IF;
  
  -- Update car's current_bid to show the latest bid (not necessarily highest)
  -- This gives dealers feedback that bids are being accepted
  UPDATE cars
  SET current_bid = p_amount,
      updated_at = NOW()
  WHERE id = p_car_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_bid_id,
    'amount', p_amount
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;