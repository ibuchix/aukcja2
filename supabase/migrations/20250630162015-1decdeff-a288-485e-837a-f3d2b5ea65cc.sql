
-- Migration: Remove proxy bidding system and implement simplified bidding
-- This migration removes all proxy bidding functionality and creates the new simplified system

-- Step 1: Drop proxy bidding related tables and functions
DROP TABLE IF EXISTS proxy_bids CASCADE;

-- Step 2: Drop proxy bidding related functions
DROP FUNCTION IF EXISTS auto_proxy_bid() CASCADE;
DROP FUNCTION IF EXISTS calculate_optimal_proxy_bid(uuid, uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS get_dealer_bid_exposure(uuid) CASCADE;
DROP FUNCTION IF EXISTS analyze_bidding_strategy(uuid) CASCADE;

-- Step 3: Create dealer_won_vehicles table for tracking auction wins
CREATE TABLE dealer_won_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  auction_end_time timestamp with time zone NOT NULL,
  winning_bid_amount numeric NOT NULL,
  original_bid_amount numeric NOT NULL,
  second_highest_bid numeric,
  platform_fee numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_date timestamp with time zone,
  seller_details_unlocked boolean NOT NULL DEFAULT false,
  stripe_payment_intent_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure one win per car
  UNIQUE(car_id)
);

-- Add indexes for performance
CREATE INDEX idx_dealer_won_vehicles_dealer_id ON dealer_won_vehicles(dealer_id);
CREATE INDEX idx_dealer_won_vehicles_payment_status ON dealer_won_vehicles(payment_status);
CREATE INDEX idx_dealer_won_vehicles_created_at ON dealer_won_vehicles(created_at DESC);

-- Step 4: Create function to process auction end with simplified logic
CREATE OR REPLACE FUNCTION process_auction_end(p_car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_car RECORD;
  v_winning_bid RECORD;
  v_second_bid RECORD;
  v_final_amount numeric;
  v_platform_fee numeric;
  v_won_vehicle_id uuid;
BEGIN
  -- Get car details
  SELECT * INTO v_car
  FROM cars
  WHERE id = p_car_id AND auction_status = 'active';
  
  IF v_car.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Car not found or auction not active'
    );
  END IF;
  
  -- Get the highest bid
  SELECT b.*, d.dealership_name
  INTO v_winning_bid
  FROM bids b
  JOIN dealers d ON b.dealer_id = d.id
  WHERE b.car_id = p_car_id AND b.status = 'active'
  ORDER BY b.amount DESC
  LIMIT 1;
  
  IF v_winning_bid.id IS NULL THEN
    -- No bids, mark auction as ended without sale
    UPDATE cars
    SET auction_status = 'ended',
        status = 'available',
        updated_at = now()
    WHERE id = p_car_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'result', 'no_bids',
      'message', 'Auction ended with no bids'
    );
  END IF;
  
  -- Get the second highest bid
  SELECT * INTO v_second_bid
  FROM bids
  WHERE car_id = p_car_id 
    AND status = 'active'
    AND dealer_id != v_winning_bid.dealer_id
  ORDER BY amount DESC
  LIMIT 1;
  
  -- Calculate final amount based on the 250 ZŁ rule
  IF v_second_bid.id IS NULL THEN
    -- Only one bidder, they win at their bid amount
    v_final_amount := v_winning_bid.amount;
  ELSE
    -- Apply the 250 ZŁ rule
    IF v_winning_bid.amount - v_second_bid.amount >= 250 THEN
      v_final_amount := v_second_bid.amount + 250;
    ELSE
      v_final_amount := v_winning_bid.amount;
    END IF;
  END IF;
  
  -- Calculate platform fee (5% of final amount, can be adjusted)
  v_platform_fee := v_final_amount * 0.05;
  
  -- Create won vehicle record
  INSERT INTO dealer_won_vehicles (
    dealer_id,
    car_id,
    auction_end_time,
    winning_bid_amount,
    original_bid_amount,
    second_highest_bid,
    platform_fee
  ) VALUES (
    v_winning_bid.dealer_id,
    p_car_id,
    now(),
    v_final_amount,
    v_winning_bid.amount,
    v_second_bid.amount,
    v_platform_fee
  ) RETURNING id INTO v_won_vehicle_id;
  
  -- Update car status
  UPDATE cars
  SET auction_status = 'sold',
      status = 'sold',
      current_bid = v_final_amount,
      updated_at = now()
  WHERE id = p_car_id;
  
  -- Update winning bid status
  UPDATE bids
  SET status = 'won',
      updated_at = now()
  WHERE id = v_winning_bid.id;
  
  -- Update other bids to lost
  UPDATE bids
  SET status = 'lost',
      updated_at = now()
  WHERE car_id = p_car_id AND id != v_winning_bid.id;
  
  -- Log the auction result
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_winning_bid.dealer_id,
    'auction_won',
    'car',
    p_car_id,
    jsonb_build_object(
      'won_vehicle_id', v_won_vehicle_id,
      'final_amount', v_final_amount,
      'original_bid', v_winning_bid.amount,
      'second_highest_bid', v_second_bid.amount,
      'platform_fee', v_platform_fee
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'result', 'sold',
    'winner_dealer_id', v_winning_bid.dealer_id,
    'final_amount', v_final_amount,
    'original_bid', v_winning_bid.amount,
    'second_highest_bid', v_second_bid.amount,
    'platform_fee', v_platform_fee,
    'won_vehicle_id', v_won_vehicle_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- Step 5: Update place_bid function to remove proxy parameters
CREATE OR REPLACE FUNCTION place_bid(
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

-- Step 6: Create function to process all ended auctions (for cron job)
CREATE OR REPLACE FUNCTION process_ended_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_ended_auction RECORD;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
  v_processed_count integer := 0;
BEGIN
  -- Find all auctions that have ended but haven't been processed
  FOR v_ended_auction IN (
    SELECT c.id as car_id
    FROM cars c
    JOIN auction_schedules a ON c.id = a.car_id
    WHERE c.auction_status = 'active'
      AND a.status = 'running'
      AND a.end_time <= NOW()
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles w WHERE w.car_id = c.id
      )
  ) LOOP
    -- Process each ended auction
    SELECT process_auction_end(v_ended_auction.car_id) INTO v_result;
    
    -- Add to results
    v_results := v_results || jsonb_build_array(v_result);
    v_processed_count := v_processed_count + 1;
    
    -- Update auction schedule status
    UPDATE auction_schedules
    SET status = 'completed',
        last_status_change = now()
    WHERE car_id = v_ended_auction.car_id;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_count', v_processed_count,
    'results', v_results
  );
END;
$function$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dealer_won_vehicles_updated_at
    BEFORE UPDATE ON dealer_won_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
