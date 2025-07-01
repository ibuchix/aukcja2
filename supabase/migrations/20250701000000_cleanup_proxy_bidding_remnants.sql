
-- Remove the duplicate place_bid function that still has proxy parameters
DROP FUNCTION IF EXISTS public.place_bid(uuid, uuid, numeric, boolean, numeric) CASCADE;

-- Remove the orphaned process_pending_proxy_bids function
DROP FUNCTION IF EXISTS public.process_pending_proxy_bids() CASCADE;

-- Ensure we only have the simplified place_bid function without proxy parameters
-- This function should already exist from the previous migration, but let's make sure it's correct
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
  
  -- Validate bid amount
  IF p_amount <= COALESCE(v_car.current_bid, 0) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bid amount must be higher than current bid'
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
  
  -- Update car's current bid if this is the highest
  IF p_amount > COALESCE(v_car.current_bid, 0) THEN
    UPDATE cars
    SET current_bid = p_amount,
        updated_at = NOW()
    WHERE id = p_car_id;
    
    -- Mark other bids as outbid
    UPDATE bids
    SET status = 'outbid'
    WHERE car_id = p_car_id 
      AND id != v_bid_id 
      AND amount < p_amount;
  END IF;
  
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
