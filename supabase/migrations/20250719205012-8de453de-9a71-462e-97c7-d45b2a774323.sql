-- Clean up any remaining 'running' statuses that weren't caught in the enum update
-- This can happen if records were added after the migration or had constraint issues

-- First, let's see what records still have 'running' status
-- We need to update them manually since they somehow bypassed the enum constraint

-- Update any auction_schedules that somehow still have 'running' status
UPDATE auction_schedules 
SET status = 'completed'::auction_schedule_status,
    last_status_change = NOW()
WHERE status::text = 'running' AND end_time < NOW();

-- For running auctions that should be active (within time bounds)
UPDATE auction_schedules 
SET status = 'active'::auction_schedule_status,
    last_status_change = NOW()
WHERE status::text = 'running' 
  AND start_time <= NOW() 
  AND end_time >= NOW();

-- For running auctions that should be completed (past end time)  
UPDATE auction_schedules 
SET status = 'completed'::auction_schedule_status,
    last_status_change = NOW()
WHERE status::text = 'running' AND end_time < NOW();

-- Now run the status update function to ensure everything is synchronized
SELECT public.update_auction_status();