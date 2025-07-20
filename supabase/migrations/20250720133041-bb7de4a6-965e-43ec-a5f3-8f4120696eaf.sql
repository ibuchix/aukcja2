
-- Fix the missing dealer_won_vehicles record for the Range Rover auction
-- Insert the missing record for dealer e38c66b0-36a6-4a11-8b5f-c94ce6172c6e (BARBOCA LTD)
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
  vehicle_images,
  created_at,
  updated_at
)
SELECT 
  'e38c66b0-36a6-4a11-8b5f-c94ce6172c6e'::uuid,
  'baf5220e-bcdf-453d-9843-f088bd21fff5'::uuid,
  (SELECT MAX(amount) FROM bids WHERE car_id = 'baf5220e-bcdf-453d-9843-f088bd21fff5'::uuid),
  (SELECT MAX(amount) FROM bids WHERE car_id = 'baf5220e-bcdf-453d-9843-f088bd21fff5'::uuid),
  (SELECT MAX(amount) FROM bids 
   WHERE car_id = 'baf5220e-bcdf-453d-9843-f088bd21fff5'::uuid 
   AND dealer_id != 'e38c66b0-36a6-4a11-8b5f-c94ce6172c6e'::uuid),
  0, -- Platform fee will be calculated on frontend
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
  END,
  NOW(),
  NOW()
FROM cars c
WHERE c.id = 'baf5220e-bcdf-453d-9843-f088bd21fff5'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM dealer_won_vehicles 
    WHERE car_id = 'baf5220e-bcdf-453d-9843-f088bd21fff5'::uuid
  );

-- Create a comprehensive auction processing function that handles the complete workflow
CREATE OR REPLACE FUNCTION public.process_ended_auctions_workflow()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_won_vehicles_created INTEGER := 0;
  auction_rec RECORD;
  highest_bid_rec RECORD;
  second_highest_bid NUMERIC;
  winning_amount NUMERIC;
  v_result jsonb;
BEGIN
  -- Find auctions that have ended but haven't been processed
  FOR auction_rec IN (
    SELECT c.id as car_id, c.seller_id, c.auction_end_time, c.reserve_price,
           c.make, c.model, c.year, c.mileage, c.images, c.current_bid
    FROM cars c
    WHERE c.auction_status = 'ended'
      AND c.auction_end_time < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv 
        WHERE dwv.car_id = c.id
      )
      AND EXISTS (
        SELECT 1 FROM bids b 
        WHERE b.car_id = c.id 
        AND b.amount >= c.reserve_price
      )
  ) LOOP
    
    -- Get the highest bid
    SELECT b.dealer_id, b.amount, b.id as bid_id
    INTO highest_bid_rec
    FROM bids b
    WHERE b.car_id = auction_rec.car_id
      AND b.status IN ('active', 'winning')
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;
    
    -- Get second highest bid
    SELECT MAX(b.amount) INTO second_highest_bid
    FROM bids b
    WHERE b.car_id = auction_rec.car_id
      AND b.dealer_id != highest_bid_rec.dealer_id;
    
    -- Apply proxy bidding logic
    IF second_highest_bid IS NOT NULL THEN
      IF highest_bid_rec.amount - second_highest_bid > 250 THEN
        winning_amount := second_highest_bid + 250;
      ELSE
        winning_amount := highest_bid_rec.amount;
      END IF;
    ELSE
      winning_amount := highest_bid_rec.amount;
    END IF;
    
    -- Update bid statuses
    UPDATE bids 
    SET status = 'won' 
    WHERE car_id = auction_rec.car_id 
      AND dealer_id = highest_bid_rec.dealer_id
      AND amount = highest_bid_rec.amount;
    
    UPDATE bids 
    SET status = 'lost' 
    WHERE car_id = auction_rec.car_id 
      AND NOT (dealer_id = highest_bid_rec.dealer_id AND amount = highest_bid_rec.amount);
    
    -- Update car status
    UPDATE cars 
    SET auction_status = 'sold',
        current_bid = winning_amount,
        awaiting_seller_decision = true,
        updated_at = NOW()
    WHERE id = auction_rec.car_id;
    
    -- Create dealer_won_vehicles record
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
      winning_amount,
      highest_bid_rec.amount,
      second_highest_bid,
      0,
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
    
    v_processed_count := v_processed_count + 1;
    v_won_vehicles_created := v_won_vehicles_created + 1;
    
    -- Log the processing
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'auction_processing', 
      'Processed ended auction and created won vehicle record',
      jsonb_build_object(
        'car_id', auction_rec.car_id,
        'dealer_id', highest_bid_rec.dealer_id,
        'winning_amount', winning_amount,
        'original_bid', highest_bid_rec.amount
      )
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_auctions', v_processed_count,
    'won_vehicles_created', v_won_vehicles_created,
    'timestamp', NOW()
  );
END;
$$;

-- Create trigger function to automatically update payment status when seller accepts
CREATE OR REPLACE FUNCTION public.handle_seller_decision_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process if decision was just made and is 'accepted'
  IF NEW.decision = 'accepted' AND (OLD.decision IS NULL OR OLD.decision != 'accepted') THEN
    
    -- Update payment status in dealer_won_vehicles
    UPDATE dealer_won_vehicles 
    SET payment_status = 'payment_required',
        updated_at = NOW()
    WHERE car_id = NEW.car_id;
    
    -- Log the status change
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'seller_decision_processing', 
      'Updated dealer won vehicle payment status after seller acceptance',
      jsonb_build_object(
        'car_id', NEW.car_id,
        'seller_id', NEW.seller_id,
        'decision', NEW.decision
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on seller_bid_decisions
DROP TRIGGER IF EXISTS seller_decision_update_trigger ON seller_bid_decisions;
CREATE TRIGGER seller_decision_update_trigger
  AFTER INSERT OR UPDATE ON seller_bid_decisions
  FOR EACH ROW
  EXECUTE FUNCTION handle_seller_decision_update();

-- Update the cron job to run the comprehensive workflow
SELECT cron.unschedule('comprehensive-auction-processing');

SELECT cron.schedule(
  'comprehensive-auction-workflow',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT public.process_ended_auctions_workflow();'
);

-- Fix any existing cars that should be awaiting seller decisions
UPDATE cars 
SET awaiting_seller_decision = true,
    updated_at = NOW()
WHERE auction_status = 'sold'
  AND current_bid >= reserve_price
  AND awaiting_seller_decision = false
  AND NOT EXISTS (
    SELECT 1 FROM seller_bid_decisions 
    WHERE seller_bid_decisions.car_id = cars.id
  );

-- Log the immediate fix
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'workflow_automation_fix', 
  'Fixed missing dealer_won_vehicles record and implemented workflow automation',
  jsonb_build_object(
    'fixed_car_id', 'baf5220e-bcdf-453d-9843-f088bd21fff5',
    'dealer_id', 'e38c66b0-36a6-4a11-8b5f-c94ce6172c6e',
    'timestamp', NOW()
  )
);
