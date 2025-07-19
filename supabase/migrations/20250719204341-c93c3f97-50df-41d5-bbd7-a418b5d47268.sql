
-- Step 1: Clean up any existing 'running' status records by updating them to 'active'
UPDATE auction_schedules 
SET status = 'active'::auction_schedule_status 
WHERE status = 'running'::auction_schedule_status;

-- Step 2: Remove 'running' from the auction_schedule_status enum
ALTER TYPE auction_schedule_status RENAME TO auction_schedule_status_old;
CREATE TYPE auction_schedule_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Update the auction_schedules table to use the new enum
ALTER TABLE auction_schedules 
ALTER COLUMN status TYPE auction_schedule_status 
USING status::text::auction_schedule_status;

-- Drop the old enum type
DROP TYPE auction_schedule_status_old;

-- Step 3: Update get_live_auction_schedules function to use 'active' instead of 'running'
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
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Return live auction schedules - using 'active' instead of 'running'
  -- Include both 'scheduled' and 'active' statuses
  -- Filter by time to include:
  -- 1. Currently active auctions (between start and end time)
  -- 2. Scheduled auctions starting within next 24 hours
  RETURN QUERY
  SELECT 
    s.car_id,
    s.status::text,  -- Cast enum to text to match return type
    s.start_time,
    s.end_time,
    s.is_manually_controlled
  FROM auction_schedules s
  WHERE s.status IN ('scheduled', 'active')
    AND (
      -- Currently active auctions (between start and end time)
      (s.start_time <= now() AND s.end_time >= now())
      OR
      -- Scheduled auctions starting within the next 24 hours
      (s.status = 'scheduled' AND s.start_time > now() AND s.start_time <= now() + interval '24 hours')
    )
  ORDER BY s.start_time ASC;
END;
$$;

-- Step 4: Update place_bid function to use 'active' consistently
CREATE OR REPLACE FUNCTION public.place_bid(
  p_car_id uuid,
  p_dealer_id uuid,
  p_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_car RECORD;
  v_schedule RECORD;
  v_current_highest_bid numeric := 0;
  v_min_increment numeric := 100;
  v_required_amount numeric;
  v_bid_id uuid;
BEGIN
  -- Get car details
  SELECT * INTO v_car FROM cars WHERE id = p_car_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Car not found');
  END IF;
  
  -- Get auction schedule details
  SELECT * INTO v_schedule 
  FROM auction_schedules 
  WHERE car_id = p_car_id 
    AND status = 'active'  -- Only allow bidding on active auctions
    AND start_time <= now() 
    AND end_time >= now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auction is not currently active or accepting bids');
  END IF;
  
  -- Get current highest bid
  SELECT COALESCE(MAX(amount), 0) INTO v_current_highest_bid
  FROM bids 
  WHERE car_id = p_car_id AND status = 'active';
  
  -- Calculate minimum required bid
  v_required_amount := GREATEST(v_car.reserve_price, v_current_highest_bid + v_min_increment);
  
  -- Validate bid amount
  IF p_amount < v_required_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Bid must be at least ' || v_required_amount::text,
      'minimum_bid', v_required_amount
    );
  END IF;
  
  -- Mark previous bids from this dealer as outbid
  UPDATE bids 
  SET status = 'outbid' 
  WHERE car_id = p_car_id AND dealer_id = p_dealer_id AND status = 'active';
  
  -- Insert new bid
  INSERT INTO bids (car_id, dealer_id, amount, status)
  VALUES (p_car_id, p_dealer_id, p_amount, 'active')
  RETURNING id INTO v_bid_id;
  
  -- Update car's current bid
  UPDATE cars 
  SET current_bid = p_amount, updated_at = now()
  WHERE id = p_car_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_bid_id,
    'amount', p_amount,
    'message', 'Bid placed successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Step 5: Update manual_auction_status_update function to use consistent terminology
CREATE OR REPLACE FUNCTION public.manual_auction_status_update()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Start scheduled auctions (scheduled -> active)
  UPDATE auction_schedules
  SET 
    status = 'active'::auction_schedule_status,
    last_status_change = NOW()
  WHERE status = 'scheduled'::auction_schedule_status
    AND start_time <= NOW()
    AND end_time > NOW();
    
  GET DIAGNOSTICS v_started_count = ROW_COUNT;
  
  -- Complete active auctions (active -> completed) 
  UPDATE auction_schedules
  SET 
    status = 'completed'::auction_schedule_status,
    last_status_change = NOW()
  WHERE status = 'active'::auction_schedule_status
    AND end_time <= NOW();
    
  GET DIAGNOSTICS v_completed_count = ROW_COUNT;
  
  -- Update corresponding cars table
  UPDATE cars 
  SET 
    auction_status = 'active',
    updated_at = NOW()
  WHERE id IN (
    SELECT car_id 
    FROM auction_schedules 
    WHERE status = 'active'::auction_schedule_status
  );
  
  UPDATE cars 
  SET 
    auction_status = 'ended',
    updated_at = NOW()
  WHERE id IN (
    SELECT car_id 
    FROM auction_schedules 
    WHERE status = 'completed'::auction_schedule_status
  );
  
  -- Build result
  v_result := jsonb_build_object(
    'started_auctions', v_started_count,
    'completed_auctions', v_completed_count,
    'timestamp', NOW(),
    'status', 'success'
  );
  
  -- Log the update
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_update', 
    'Manual auction status update completed', 
    v_result
  );
  
  RETURN v_result;
END;
$$;
