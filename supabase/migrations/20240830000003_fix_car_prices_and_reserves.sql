
-- Fix car prices and reserve prices from valuation data
-- This migration extracts prices from valuation_data and populates the price and reserve_price columns

-- Update cars that have 0 price but have valuation data with a base price
UPDATE cars 
SET price = CASE 
  WHEN valuation_data->>'basePrice' IS NOT NULL THEN (valuation_data->>'basePrice')::numeric
  WHEN valuation_data->>'price' IS NOT NULL THEN (valuation_data->>'price')::numeric
  WHEN valuation_data->>'estimatedValue' IS NOT NULL THEN (valuation_data->>'estimatedValue')::numeric
  ELSE price
END,
updated_at = NOW()
WHERE (price = 0 OR price IS NULL) 
  AND valuation_data IS NOT NULL 
  AND (
    valuation_data->>'basePrice' IS NOT NULL OR 
    valuation_data->>'price' IS NOT NULL OR 
    valuation_data->>'estimatedValue' IS NOT NULL
  );

-- Update cars that don't have reserve price but have valuation data
UPDATE cars 
SET reserve_price = CASE 
  WHEN valuation_data->>'reservePrice' IS NOT NULL THEN (valuation_data->>'reservePrice')::numeric
  WHEN valuation_data->>'reserve_price' IS NOT NULL THEN (valuation_data->>'reserve_price')::numeric
  WHEN valuation_data->>'basePrice' IS NOT NULL THEN ROUND((valuation_data->>'basePrice')::numeric * 0.8)
  WHEN price > 0 THEN ROUND(price * 0.8)
  ELSE NULL
END,
updated_at = NOW()
WHERE reserve_price IS NULL 
  AND (
    valuation_data IS NOT NULL OR 
    price > 0
  );

-- Update car titles for those that don't have one
UPDATE cars 
SET title = CONCAT(COALESCE(year::text, ''), ' ', COALESCE(make, ''), ' ', COALESCE(model, '')),
updated_at = NOW()
WHERE (title IS NULL OR title = '') 
  AND make IS NOT NULL 
  AND model IS NOT NULL;

-- Log the updates
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'data_migration', 
  'Fixed car prices and reserve prices from valuation data', 
  jsonb_build_object(
    'migration', '20240830000003_fix_car_prices_and_reserves',
    'timestamp', NOW()
  )
);
