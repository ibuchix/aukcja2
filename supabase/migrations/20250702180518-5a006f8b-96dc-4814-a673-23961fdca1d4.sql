-- Create test data for dealer_won_vehicles to verify the system works
INSERT INTO dealer_won_vehicles (
  dealer_id,
  car_id,
  winning_bid_amount,
  original_bid_amount,
  second_highest_bid,
  platform_fee,
  auction_end_time,
  payment_status,
  seller_details_unlocked
) VALUES (
  '63ca09ed-65fd-41a2-b64b-b9b7d0445100', -- Toledo Ltd dealer ID
  (SELECT id FROM cars LIMIT 1), -- Use any existing car
  15000,
  16000,
  14500,
  600,
  NOW() - INTERVAL '1 day',
  'pending',
  false
);