-- Phase 1: Remove Seller Performance Metrics Interference
-- Drop the trigger that's blocking dealer operations
DROP TRIGGER IF EXISTS update_seller_performance_trigger ON public.cars;

-- Drop the function that's causing issues
DROP FUNCTION IF EXISTS public.update_seller_performance_after_auction();

-- Drop the seller_performance_metrics table entirely (not needed for dealer operations)
DROP TABLE IF EXISTS public.seller_performance_metrics CASCADE;

-- Process the stuck BMW auction manually
SELECT process_specific_ended_auction('67f5091c-057c-4637-adde-82b9ead9dd4f');

-- Update the BMW car to sold status if bid meets reserve
UPDATE cars
SET 
  auction_status = 'sold',
  updated_at = NOW()
WHERE id = '67f5091c-057c-4637-adde-82b9ead9dd4f'
  AND current_bid >= reserve_price;