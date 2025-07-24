-- Create a SECURITY DEFINER function as a fallback for auction processing
-- This bypasses RLS and service role authentication issues
CREATE OR REPLACE FUNCTION public.process_ended_auctions_securely()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_ended_auctions_count INTEGER := 0;
  v_results jsonb := '[]'::jsonb;
  auction_rec RECORD;
  highest_bid_rec RECORD;
  v_second_highest_bid NUMERIC;
  v_winning_amount NUMERIC;
  v_platform_fee NUMERIC;
BEGIN
  -- Log the start of processing
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_processing_secure', 
    'Starting secure auction processing', 
    jsonb_build_object('timestamp', NOW())
  );

  -- First, transition any active auctions that have ended to 'ended' status
  UPDATE cars 
  SET 
    auction_status = 'ended',
    updated_at = NOW()
  WHERE auction_status = 'active'
    AND auction_end_time <= NOW()
    AND auction_end_time IS NOT NULL;
  
  GET DIAGNOSTICS v_ended_auctions_count = ROW_COUNT;
  
  -- Process each ended auction that hasn't been processed yet
  FOR auction_rec IN 
    SELECT c.id as car_id, c.seller_id, c.auction_end_time, c.reserve_price,
           c.make, c.model, c.year, c.current_bid, c.mileage, c.images
    FROM cars c
    WHERE c.auction_status = 'ended'
      AND c.auction_end_time <= NOW()
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv WHERE dwv.car_id = c.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM auction_results ar WHERE ar.car_id = c.id
      )
  LOOP
    -- Get the highest bid for this auction
    SELECT b.dealer_id, b.amount, b.id as bid_id
    INTO highest_bid_rec
    FROM bids b
    WHERE b.car_id = auction_rec.car_id
      AND b.status = 'active'
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;

    -- Get second highest bid for proxy bidding logic
    SELECT COALESCE(MAX(b.amount), 0)
    INTO v_second_highest_bid
    FROM bids b
    WHERE b.car_id = auction_rec.car_id
      AND b.status = 'active'
      AND (highest_bid_rec.dealer_id IS NULL OR b.dealer_id != highest_bid_rec.dealer_id);

    -- Process if there's a winning bid that meets reserve
    IF highest_bid_rec.amount IS NOT NULL AND highest_bid_rec.amount >= auction_rec.reserve_price THEN
      -- Apply proxy bidding logic: winning amount is 250 PLN above second highest
      -- If second highest is 0 or difference is less than 250, use full highest bid
      IF v_second_highest_bid > 0 AND (highest_bid_rec.amount - v_second_highest_bid) > 250 THEN
        v_winning_amount := v_second_highest_bid + 250;
      ELSE
        v_winning_amount := highest_bid_rec.amount;
      END IF;

      -- Calculate platform fee based on winning amount
      CASE 
        WHEN v_winning_amount < 5000 THEN v_platform_fee := 600;
        WHEN v_winning_amount < 10000 THEN v_platform_fee := 700;
        WHEN v_winning_amount < 20000 THEN v_platform_fee := 800;
        WHEN v_winning_amount < 30000 THEN v_platform_fee := 900;
        WHEN v_winning_amount < 40000 THEN v_platform_fee := 1000;
        WHEN v_winning_amount < 50000 THEN v_platform_fee := 1100;
        WHEN v_winning_amount < 60000 THEN v_platform_fee := 1200;
        WHEN v_winning_amount < 70000 THEN v_platform_fee := 1300;
        WHEN v_winning_amount < 80000 THEN v_platform_fee := 1400;
        WHEN v_winning_amount < 90000 THEN v_platform_fee := 1500;
        WHEN v_winning_amount < 100000 THEN v_platform_fee := 1600;
        WHEN v_winning_amount < 125000 THEN v_platform_fee := 1700;
        WHEN v_winning_amount < 150000 THEN v_platform_fee := 1800;
        WHEN v_winning_amount < 175000 THEN v_platform_fee := 1900;
        WHEN v_winning_amount < 200000 THEN v_platform_fee := 2050;
        WHEN v_winning_amount < 225000 THEN v_platform_fee := 2150;
        WHEN v_winning_amount < 250000 THEN v_platform_fee := 2250;
        WHEN v_winning_amount < 300000 THEN v_platform_fee := 2550;
        WHEN v_winning_amount < 350000 THEN v_platform_fee := 2650;
        WHEN v_winning_amount < 400000 THEN v_platform_fee := 2750;
        WHEN v_winning_amount < 500000 THEN v_platform_fee := 2850;
        ELSE v_platform_fee := 3150;
      END CASE;

      -- Mark winning bid
      UPDATE bids 
      SET status = 'winning' 
      WHERE car_id = auction_rec.car_id 
        AND dealer_id = highest_bid_rec.dealer_id
        AND amount = highest_bid_rec.amount;

      -- Mark other bids as lost
      UPDATE bids 
      SET status = 'lost' 
      WHERE car_id = auction_rec.car_id 
        AND NOT (dealer_id = highest_bid_rec.dealer_id AND amount = highest_bid_rec.amount);

      -- Create won vehicle record
      INSERT INTO dealer_won_vehicles (
        dealer_id,
        car_id,
        winning_bid_amount,
        original_bid_amount,
        second_highest_bid,
        platform_fee,
        auction_end_time,
        payment_status,
        seller_details_unlocked,
        vehicle_make,
        vehicle_model, 
        vehicle_year,
        vehicle_mileage,
        vehicle_images
      ) VALUES (
        highest_bid_rec.dealer_id,
        auction_rec.car_id,
        v_winning_amount,
        highest_bid_rec.amount,
        v_second_highest_bid,
        v_platform_fee,
        auction_rec.auction_end_time,
        'awaiting_seller_decision',
        false,
        auction_rec.make,
        auction_rec.model,
        auction_rec.year,
        auction_rec.mileage,
        CASE 
          WHEN auction_rec.images IS NOT NULL THEN to_jsonb(auction_rec.images)
          ELSE '[]'::jsonb
        END
      );

      -- Update car status
      UPDATE cars 
      SET 
        current_bid = v_winning_amount,
        auction_status = 'sold',
        awaiting_seller_decision = true,
        updated_at = NOW()
      WHERE id = auction_rec.car_id;

      -- Create auction result
      INSERT INTO auction_results (
        car_id,
        final_price,
        total_bids,
        unique_bidders,
        sale_status,
        highest_bid_dealer_id
      ) VALUES (
        auction_rec.car_id,
        v_winning_amount,
        (SELECT COUNT(*) FROM bids WHERE car_id = auction_rec.car_id),
        (SELECT COUNT(DISTINCT dealer_id) FROM bids WHERE car_id = auction_rec.car_id),
        'sold',
        highest_bid_rec.dealer_id
      );

      v_processed_count := v_processed_count + 1;
      
    ELSE
      -- No winning bid - mark all bids as ended
      UPDATE bids 
      SET status = 'ended' 
      WHERE car_id = auction_rec.car_id AND status = 'active';

      -- Create auction result for unsold
      INSERT INTO auction_results (
        car_id,
        final_price,
        total_bids,
        unique_bidders,
        sale_status
      ) VALUES (
        auction_rec.car_id,
        COALESCE(highest_bid_rec.amount, 0),
        (SELECT COUNT(*) FROM bids WHERE car_id = auction_rec.car_id),
        (SELECT COUNT(DISTINCT dealer_id) FROM bids WHERE car_id = auction_rec.car_id),
        'unsold'
      );
    END IF;
  END LOOP;

  -- Log completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_processing_secure', 
    'Completed secure auction processing', 
    jsonb_build_object(
      'processed_count', v_processed_count,
      'ended_auctions_count', v_ended_auctions_count,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'processed_auctions', v_processed_count,
    'ended_auctions', v_ended_auctions_count,
    'timestamp', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'auction_processing_secure_error', 
    'Error in secure auction processing', 
    SQLERRM,
    jsonb_build_object(
      'error_code', SQLSTATE,
      'timestamp', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'processed_count', v_processed_count
  );
END;
$$;