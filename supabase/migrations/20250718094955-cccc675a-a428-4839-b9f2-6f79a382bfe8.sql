
-- Step 1: Fix the critical data type bug in update_auction_status function
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_count INTEGER := 0;
  v_completed_count INTEGER := 0;
  v_processed_count INTEGER := 0;
  v_payment_updates INTEGER := 0;
  v_process_result jsonb;
  v_result jsonb;
BEGIN
  -- Step 1: Start scheduled auctions (scheduled -> running)
  UPDATE auction_schedules 
  SET status = 'running',
      last_status_change = NOW(),
      updated_at = NOW()
  WHERE status = 'scheduled' 
    AND start_time <= NOW();
  
  GET DIAGNOSTICS v_started_count = ROW_COUNT;

  -- Step 2: Complete running auctions (running -> completed)  
  UPDATE auction_schedules 
  SET status = 'completed',
      last_status_change = NOW(),
      updated_at = NOW()
  WHERE status = 'running' 
    AND end_time < NOW();
  
  GET DIAGNOSTICS v_completed_count = ROW_COUNT;

  -- Step 3: Update cars auction status to match schedule status
  -- Set cars to active when auction schedule becomes running
  UPDATE cars 
  SET auction_status = 'active',
      auction_scheduled = true,
      updated_at = NOW()
  WHERE id IN (
    SELECT car_id FROM auction_schedules 
    WHERE status = 'running'
  ) AND (auction_status != 'active' OR auction_scheduled = false);

  -- Set cars to ended when auction schedule becomes completed
  UPDATE cars 
  SET auction_status = 'ended',
      updated_at = NOW()
  WHERE id IN (
    SELECT car_id FROM auction_schedules 
    WHERE status = 'completed'
  ) AND auction_status != 'ended';

  -- Step 4: Process completed auctions to create won vehicle records
  -- FIX: Handle the JSONB return type properly
  SELECT public.process_ended_auctions() INTO v_process_result;
  
  -- Extract the integer count from the JSONB response safely
  v_processed_count := COALESCE((v_process_result)::integer, 0);
  
  -- Step 5: Update payment statuses based on seller decisions
  SELECT public.update_won_vehicle_payment_status() INTO v_payment_updates;

  -- Build result
  v_result := jsonb_build_object(
    'started_auctions', v_started_count,
    'completed_auctions', v_completed_count,
    'processed_auctions', v_processed_count,
    'payment_status_updates', v_payment_updates,
    'timestamp', NOW()
  );

  -- Log the automated execution
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'automated_auction_update', 
    'Automated auction status update executed', 
    v_result
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'automated_auction_update_error', 
    'Error in update_auction_status function', 
    SQLERRM,
    jsonb_build_object('error_code', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$;

-- Step 2: Fix the Skoda Rapid auction that should have won vehicle record
-- First, let's update the car status properly since seller accepted
UPDATE cars 
SET auction_status = 'sold',
    awaiting_seller_decision = true,
    updated_at = NOW()
WHERE id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND auction_status != 'sold';

-- Update the winning bid status to 'won'
UPDATE bids 
SET status = 'won', 
    updated_at = NOW()
WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND amount = (
    SELECT MAX(amount) FROM bids 
    WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  )
  AND status != 'won';

-- Update other bids to 'lost'
UPDATE bids 
SET status = 'lost', 
    updated_at = NOW()
WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND amount < (
    SELECT MAX(amount) FROM bids 
    WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  )
  AND status != 'lost';

-- Create the missing dealer_won_vehicles record for the Skoda
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
)
SELECT 
  b.dealer_id,
  c.id,
  b.amount,
  b.amount,
  (SELECT MAX(amount) FROM bids b2 
   WHERE b2.car_id = c.id 
   AND b2.dealer_id != b.dealer_id),
  0, -- Platform fee calculated on frontend
  c.auction_end_time,
  'payment_required', -- Since seller already accepted
  false,
  c.make,
  c.model,
  c.year,
  c.mileage,
  CASE 
    WHEN c.images IS NOT NULL THEN to_jsonb(c.images)
    ELSE '[]'::jsonb
  END
FROM cars c
JOIN bids b ON c.id = b.car_id
WHERE c.id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND b.amount = (
    SELECT MAX(amount) FROM bids 
    WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  )
  AND NOT EXISTS (
    SELECT 1 FROM dealer_won_vehicles 
    WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  );

-- Step 3: Enhanced process_ended_auctions function for better resilience
CREATE OR REPLACE FUNCTION public.process_ended_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auction RECORD;
  v_highest_bid RECORD;
  v_second_highest RECORD;
  v_processed_count INTEGER := 0;
  v_won_vehicles_created INTEGER := 0;
BEGIN
  -- Process all ended auctions that need processing
  FOR v_auction IN
    SELECT c.id, c.title, c.current_bid, c.reserve_price, c.auction_status, 
           c.make, c.model, c.year, c.mileage, c.images, c.auction_end_time,
           c.awaiting_seller_decision
    FROM cars c
    WHERE c.auction_status = 'ended'
      AND c.auction_end_time < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv WHERE dwv.car_id = c.id
      )
  LOOP
    BEGIN
      -- Get the highest bid for this auction
      SELECT b.id, b.dealer_id, b.amount, b.created_at, b.status
      INTO v_highest_bid
      FROM bids b
      WHERE b.car_id = v_auction.id
        AND b.status IN ('active', 'outbid', 'won') 
      ORDER BY b.amount DESC, b.created_at ASC
      LIMIT 1;

      -- Get second highest bid for fee calculation
      SELECT b.amount
      INTO v_second_highest
      FROM bids b
      WHERE b.car_id = v_auction.id
        AND b.dealer_id != COALESCE(v_highest_bid.dealer_id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND b.status IN ('active', 'outbid', 'lost')
      ORDER BY b.amount DESC
      LIMIT 1;

      IF v_highest_bid.id IS NOT NULL THEN
        -- Check if reserve price was met
        IF v_highest_bid.amount >= v_auction.reserve_price THEN
          
          -- Only update bid statuses if not already done
          IF v_highest_bid.status != 'won' THEN
            UPDATE bids 
            SET status = 'won', updated_at = NOW()
            WHERE id = v_highest_bid.id;
          END IF;
          
          UPDATE bids 
          SET status = 'lost', updated_at = NOW()
          WHERE car_id = v_auction.id 
            AND id != v_highest_bid.id 
            AND status NOT IN ('lost', 'ended');

          -- Update car status if not already sold
          IF v_auction.auction_status != 'sold' THEN
            UPDATE cars 
            SET auction_status = 'sold',
                current_bid = v_highest_bid.amount,
                awaiting_seller_decision = true,
                updated_at = NOW()
            WHERE id = v_auction.id;
          END IF;

          -- Check if seller has already accepted this bid
          DECLARE
            v_seller_decision text;
            v_payment_status text := 'awaiting_seller_decision';
          BEGIN
            SELECT decision INTO v_seller_decision
            FROM seller_bid_decisions 
            WHERE car_id = v_auction.id;
            
            -- If seller accepted, set payment status accordingly
            IF v_seller_decision = 'accepted' THEN
              v_payment_status := 'payment_required';
            END IF;
          END;

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
            v_highest_bid.dealer_id,
            v_auction.id,
            v_highest_bid.amount,
            v_highest_bid.amount,
            v_second_highest.amount,
            0, -- Platform fee calculated on frontend
            COALESCE(v_auction.auction_end_time, NOW()),
            v_payment_status,
            false,
            COALESCE(v_auction.make, 'Unknown'),
            COALESCE(v_auction.model, 'Unknown'),
            COALESCE(v_auction.year, 2000),
            v_auction.mileage,
            CASE 
              WHEN v_auction.images IS NOT NULL THEN to_jsonb(v_auction.images)
              ELSE '[]'::jsonb
            END
          );

          v_won_vehicles_created := v_won_vehicles_created + 1;
          
          -- Log the successful processing
          INSERT INTO system_logs (
            log_type, 
            message, 
            details
          ) VALUES (
            'auction_processing_success', 
            'Successfully processed ended auction with winner',
            jsonb_build_object(
              'car_id', v_auction.id,
              'winning_bid', v_highest_bid.amount,
              'dealer_id', v_highest_bid.dealer_id,
              'reserve_met', true,
              'payment_status', v_payment_status
            )
          );

        ELSE
          -- Reserve price not met
          UPDATE bids 
          SET status = 'ended', updated_at = NOW()
          WHERE car_id = v_auction.id AND status NOT IN ('ended', 'lost');

          UPDATE cars 
          SET auction_status = 'ended',
              current_bid = v_highest_bid.amount,
              updated_at = NOW()
          WHERE id = v_auction.id;

          -- Log the processing
          INSERT INTO system_logs (
            log_type, 
            message, 
            details
          ) VALUES (
            'auction_processing_no_sale', 
            'Processed ended auction - reserve not met',
            jsonb_build_object(
              'car_id', v_auction.id,
              'highest_bid', v_highest_bid.amount,
              'reserve_price', v_auction.reserve_price,
              'reserve_met', false
            )
          );
        END IF;
      ELSE
        -- No bids found
        UPDATE cars 
        SET auction_status = 'ended',
            updated_at = NOW()
        WHERE id = v_auction.id;

        -- Log no bids
        INSERT INTO system_logs (
          log_type, 
          message, 
          details
        ) VALUES (
          'auction_processing_no_bids', 
          'Processed ended auction with no bids',
          jsonb_build_object('car_id', v_auction.id)
        );
      END IF;

      v_processed_count := v_processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Log the error and continue with next auction
      INSERT INTO system_logs (
        log_type, 
        message, 
        error_message,
        details
      ) VALUES (
        'auction_processing_error', 
        'Error processing ended auction',
        SQLERRM,
        jsonb_build_object(
          'car_id', v_auction.id,
          'error_code', SQLSTATE
        )
      );
    END;
  END LOOP;

  -- Log summary
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_processing_summary', 
    'Completed auction processing cycle',
    jsonb_build_object(
      'processed_count', v_processed_count,
      'won_vehicles_created', v_won_vehicles_created,
      'timestamp', NOW()
    )
  );

  RETURN v_processed_count;
END;
$$;

-- Step 4: Run the fixed function to test it
SELECT public.update_auction_status();
