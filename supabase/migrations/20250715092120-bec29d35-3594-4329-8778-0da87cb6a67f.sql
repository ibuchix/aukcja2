-- Phase 1: Fix auction visibility by updating car properties and improving auction display logic

-- 1. Update existing BMW cars to have proper auction properties
UPDATE cars 
SET 
  is_auction = true,
  auction_status = 'active',
  updated_at = NOW()
WHERE id IN (
  SELECT car_id 
  FROM auction_schedules 
  WHERE status IN ('scheduled', 'running')
);

-- 2. Create a trigger to automatically set is_auction and auction_status when a schedule is created
CREATE OR REPLACE FUNCTION public.set_car_auction_properties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When an auction schedule is created or updated, ensure the car has proper auction properties
  UPDATE public.cars
  SET 
    is_auction = true,
    auction_status = 'active',
    updated_at = now()
  WHERE id = NEW.car_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT on auction_schedules
DROP TRIGGER IF EXISTS trigger_set_car_auction_properties_on_insert ON public.auction_schedules;
CREATE TRIGGER trigger_set_car_auction_properties_on_insert
  AFTER INSERT ON public.auction_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_car_auction_properties();

-- Create trigger for UPDATE on auction_schedules
DROP TRIGGER IF EXISTS trigger_set_car_auction_properties_on_update ON public.auction_schedules;
CREATE TRIGGER trigger_set_car_auction_properties_on_update
  AFTER UPDATE ON public.auction_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_car_auction_properties();

-- 3. Update the process_specific_ended_auction function to set proper payment status
CREATE OR REPLACE FUNCTION public.process_specific_ended_auction(p_car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auction_rec RECORD;
  highest_bid_rec RECORD;
  result JSONB := '{"processed": false}'::jsonb;
BEGIN
  -- Get auction details with vehicle information
  SELECT c.id as car_id, c.seller_id, c.auction_end_time, c.reserve_price,
         c.make, c.model, c.year, c.current_bid, c.auction_status, c.mileage, c.images
  INTO auction_rec
  FROM cars c
  WHERE c.id = p_car_id;

  -- Check if auction exists and has ended
  IF auction_rec.car_id IS NULL THEN
    RETURN '{"error": "Car not found"}'::jsonb;
  END IF;

  IF auction_rec.auction_end_time > NOW() THEN
    RETURN '{"error": "Auction has not ended yet"}'::jsonb;
  END IF;

  -- Check if already processed
  IF EXISTS (SELECT 1 FROM dealer_won_vehicles WHERE car_id = p_car_id) THEN
    RETURN '{"error": "Auction already processed"}'::jsonb;
  END IF;

  -- Get the highest bid
  SELECT b.dealer_id, b.amount, b.id as bid_id
  INTO highest_bid_rec
  FROM bids b
  WHERE b.car_id = p_car_id
    AND b.status = 'active'
  ORDER BY b.amount DESC, b.created_at ASC
  LIMIT 1;

  -- Process if there's a winning bid that meets reserve
  IF highest_bid_rec.amount IS NOT NULL AND highest_bid_rec.amount >= auction_rec.reserve_price THEN
    -- Mark winning bid
    UPDATE bids 
    SET status = 'winning' 
    WHERE car_id = p_car_id 
      AND dealer_id = highest_bid_rec.dealer_id
      AND amount = highest_bid_rec.amount;

    -- Mark other bids as lost
    UPDATE bids 
    SET status = 'lost' 
    WHERE car_id = p_car_id 
      AND NOT (dealer_id = highest_bid_rec.dealer_id AND amount = highest_bid_rec.amount);

    -- Create won vehicle record with "awaiting_seller_decision" status
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
      p_car_id,
      highest_bid_rec.amount,
      highest_bid_rec.amount,
      (SELECT MAX(amount) FROM bids 
       WHERE car_id = p_car_id 
         AND dealer_id != highest_bid_rec.dealer_id 
         AND status IN ('active', 'lost')),
      0,
      auction_rec.auction_end_time,
      'awaiting_seller_decision', -- Set proper initial status
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

    -- Update car status manually (avoid triggers)
    UPDATE cars 
    SET current_bid = highest_bid_rec.amount,
        auction_status = 'sold',
        awaiting_seller_decision = true,
        updated_at = NOW()
    WHERE id = p_car_id;

    result := jsonb_build_object(
      'processed', true,
      'car_id', p_car_id,
      'winning_bid', highest_bid_rec.amount,
      'dealer_id', highest_bid_rec.dealer_id,
      'payment_status', 'awaiting_seller_decision'
    );
  ELSE
    -- Mark all bids as ended
    UPDATE bids 
    SET status = 'ended' 
    WHERE car_id = p_car_id AND status = 'active';

    -- Update car status
    UPDATE cars 
    SET auction_status = 'ended',
        updated_at = NOW()
    WHERE id = p_car_id;

    result := jsonb_build_object(
      'processed', true,
      'car_id', p_car_id,
      'result', 'no_sale',
      'highest_bid', COALESCE(highest_bid_rec.amount, 0),
      'reserve_price', auction_rec.reserve_price
    );
  END IF;

  RETURN result;
END;
$$;