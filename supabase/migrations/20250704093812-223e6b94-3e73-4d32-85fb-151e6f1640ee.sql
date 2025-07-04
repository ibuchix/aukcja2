-- Phase 1: Add vehicle details columns to dealer_won_vehicles table
ALTER TABLE public.dealer_won_vehicles 
ADD COLUMN vehicle_make text,
ADD COLUMN vehicle_model text, 
ADD COLUMN vehicle_year integer,
ADD COLUMN vehicle_mileage numeric,
ADD COLUMN vehicle_images jsonb DEFAULT '[]'::jsonb;

-- Phase 2: Backfill existing records with vehicle details from cars table
-- Convert text[] images to jsonb format
UPDATE public.dealer_won_vehicles 
SET 
  vehicle_make = cars.make,
  vehicle_model = cars.model,
  vehicle_year = cars.year,
  vehicle_mileage = cars.mileage,
  vehicle_images = CASE 
    WHEN cars.images IS NOT NULL THEN to_jsonb(cars.images)
    ELSE '[]'::jsonb
  END
FROM public.cars 
WHERE dealer_won_vehicles.car_id = cars.id;

-- Phase 3: Make the columns NOT NULL after backfilling (with safe defaults for any missing data)
UPDATE public.dealer_won_vehicles 
SET 
  vehicle_make = COALESCE(vehicle_make, 'Unknown'),
  vehicle_model = COALESCE(vehicle_model, 'Unknown'),
  vehicle_year = COALESCE(vehicle_year, 2000)
WHERE vehicle_make IS NULL OR vehicle_model IS NULL OR vehicle_year IS NULL;

ALTER TABLE public.dealer_won_vehicles 
ALTER COLUMN vehicle_make SET NOT NULL,
ALTER COLUMN vehicle_model SET NOT NULL,
ALTER COLUMN vehicle_year SET NOT NULL;

-- Phase 4: Update the process_specific_ended_auction function to populate new columns
CREATE OR REPLACE FUNCTION process_specific_ended_auction(p_car_id UUID)
RETURNS JSONB
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

    -- Create won vehicle record with vehicle details
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
      'pending',
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
        updated_at = NOW()
    WHERE id = p_car_id;

    result := jsonb_build_object(
      'processed', true,
      'car_id', p_car_id,
      'winning_bid', highest_bid_rec.amount,
      'dealer_id', highest_bid_rec.dealer_id
    );
  ELSE
    -- Mark all bids as ended
    UPDATE bids 
    SET status = 'ended' 
    WHERE car_id = p_car_id AND status = 'active';

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