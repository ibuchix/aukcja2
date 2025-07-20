
-- Phase 1: Create missing dealer_won_vehicles records with correct proxy bidding logic

-- For Renault Megane (car_id: 8da5e7c9-dde6-4c8e-b31e-44a2d9d0d86c)
-- Highest bid: 13000 by dealer 63ca09ed-65fd-41a2-b64b-b9b7d0445100
-- Second highest: 12500 by dealer 6f421866-b5b3-4c80-9a5f-e8c8c6c4e9e4
-- Winning amount: 12500 + 250 = 12750 (since difference is 500 > 250)
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
  '8da5e7c9-dde6-4c8e-b31e-44a2d9d0d86c'::uuid,
  12750, -- 12500 + 250 (proxy logic)
  13000, -- original highest bid
  12500, -- second highest bid
  800, -- Platform fee for 12750 bid
  ar.created_at, -- Use auction result creation time as end time
  'payment_required', -- Since seller already accepted
  false,
  'RENAULT',
  'MEGANE',
  2017,
  120000,
  '[]'::jsonb,
  NOW(),
  NOW()
FROM auction_results ar
WHERE ar.car_id = '8da5e7c9-dde6-4c8e-b31e-44a2d9d0d86c'
  AND NOT EXISTS (
    SELECT 1 FROM dealer_won_vehicles 
    WHERE car_id = '8da5e7c9-dde6-4c8e-b31e-44a2d9d0d86c'
  );

-- For Ford Mondeo (car_id: e0af5fe2-2f82-4c96-9f93-c4d5e3b2a8c1)
-- Highest bid: 8500 by dealer 6f421866-b5b3-4c80-9a5f-e8c8c6c4e9e4
-- Second highest: 8000 by dealer 63ca09ed-65fd-41a2-b64b-b9b7d0445100
-- Winning amount: 8000 + 250 = 8250 (since difference is 500 > 250)
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
  '6f421866-b5b3-4c80-9a5f-e8c8c6c4e9e4'::uuid,
  'e0af5fe2-2f82-4c96-9f93-c4d5e3b2a8c1'::uuid,
  8250, -- 8000 + 250 (proxy logic)
  8500, -- original highest bid
  8000, -- second highest bid
  600, -- Platform fee for 8250 bid
  ar.created_at, -- Use auction result creation time as end time
  'awaiting_seller_decision', -- No seller decision yet
  false,
  'FORD',
  'MONDEO',
  2015,
  150000,
  '[]'::jsonb,
  NOW(),
  NOW()
FROM auction_results ar
WHERE ar.car_id = 'e0af5fe2-2f82-4c96-9f93-c4d5e3b2a8c1'
  AND NOT EXISTS (
    SELECT 1 FROM dealer_won_vehicles 
    WHERE car_id = 'e0af5fe2-2f82-4c96-9f93-c4d5e3b2a8c1'
  );

-- Gap-filling query: Find ALL auctions that are sold but missing dealer_won_vehicles records
WITH missing_records AS (
  SELECT DISTINCT
    ar.car_id,
    ar.highest_bid_dealer_id,
    ar.final_price as original_bid,
    c.make,
    c.model,
    c.year,
    c.mileage,
    c.images,
    ar.created_at as auction_end_time,
    CASE 
      WHEN sbd.decision = 'accepted' THEN 'payment_required'
      ELSE 'awaiting_seller_decision'
    END as payment_status
  FROM auction_results ar
  JOIN cars c ON ar.car_id = c.id
  LEFT JOIN seller_bid_decisions sbd ON ar.car_id = sbd.car_id
  WHERE ar.sale_status = 'sold'
    AND ar.highest_bid_dealer_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM dealer_won_vehicles dwv 
      WHERE dwv.car_id = ar.car_id
    )
    -- Exclude the ones we just handled above
    AND ar.car_id NOT IN (
      '8da5e7c9-dde6-4c8e-b31e-44a2d9d0d86c',
      'e0af5fe2-2f82-4c96-9f93-c4d5e3b2a8c1'
    )
)
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
  mr.highest_bid_dealer_id,
  mr.car_id,
  -- For now, use original bid as winning amount (will be corrected by function later)
  mr.original_bid,
  mr.original_bid,
  NULL, -- Will calculate second highest separately
  0, -- Platform fee calculated on frontend
  mr.auction_end_time,
  mr.payment_status,
  false,
  COALESCE(mr.make, 'Unknown'),
  COALESCE(mr.model, 'Unknown'),
  COALESCE(mr.year, 2000),
  mr.mileage,
  CASE 
    WHEN mr.images IS NOT NULL THEN to_jsonb(mr.images)
    ELSE '[]'::jsonb
  END,
  NOW(),
  NOW()
FROM missing_records mr;

-- Log the gap-filling operation
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'gap_filling_dealer_won_vehicles', 
  'Created missing dealer_won_vehicles records with proxy bidding logic',
  jsonb_build_object(
    'renault_megane_winning_amount', 12750,
    'ford_mondeo_winning_amount', 8250,
    'timestamp', NOW()
  )
);
