-- Manually fix the Skoda auction that wasn't processed correctly
-- Step 1: Update car status to sold since seller accepted
UPDATE cars 
SET auction_status = 'sold',
    awaiting_seller_decision = true,
    updated_at = NOW()
WHERE id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef';

-- Step 2: Update winning bid status
UPDATE bids 
SET status = 'won', 
    updated_at = NOW()
WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND amount = 30000;

-- Step 3: Create the missing dealer_won_vehicles record
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
  '63ca09ed-65fd-41a2-b64b-b9b7d0445100'::uuid,
  'd7bc1824-5a11-4c71-9745-1d41a644f4ef'::uuid,
  30000,
  30000,
  (SELECT MAX(amount) FROM bids b2 
   WHERE b2.car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef' 
   AND b2.dealer_id != '63ca09ed-65fd-41a2-b64b-b9b7d0445100'::uuid),
  1000, -- Platform fee for 30k bid
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
WHERE c.id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND NOT EXISTS (
    SELECT 1 FROM dealer_won_vehicles 
    WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  );