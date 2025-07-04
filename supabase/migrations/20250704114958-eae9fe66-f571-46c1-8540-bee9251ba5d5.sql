-- Phase 1: Fix the auction processing issue

-- First, manually process the BMW 8-SERIES auction that ended at 11:25
SELECT process_specific_ended_auction('67f5091c-057c-4637-adde-82b9ead9dd4f');

-- Update auction schedules status from running to completed for past auctions
UPDATE auction_schedules 
SET 
  status = 'completed',
  last_status_change = NOW(),
  updated_at = NOW()
WHERE status = 'running' 
  AND end_time < NOW();

-- Update car auction status for the BMW 8-SERIES that should be sold
UPDATE cars
SET 
  auction_status = 'sold',
  updated_at = NOW()
WHERE id = '67f5091c-057c-4637-adde-82b9ead9dd4f'
  AND current_bid >= reserve_price;