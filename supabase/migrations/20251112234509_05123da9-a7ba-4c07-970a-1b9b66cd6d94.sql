-- ============================================================================
-- STEP 1: EMERGENCY FIX - Make Auctions Visible Immediately
-- ============================================================================
-- This migration:
-- 1. Manually triggers auction status update to fix stuck auctions
-- 2. Removes old 30-minute cron job
-- 3. Creates new 1-minute cron job for real-time auction status updates
-- ============================================================================

-- 1.1: Manually trigger status update to fix Mitsubishi ASX and other stuck auctions RIGHT NOW
SELECT public.manual_auction_status_update();

-- 1.2: Remove old broken 30-minute cron job
SELECT cron.unschedule('update_auction_status');

-- 1.3: Create new 1-minute cron job for auction status updates
-- This ensures auctions become visible within 60 seconds of start time
SELECT cron.schedule(
  'auction-status-update-every-minute',
  '* * * * *',  -- Runs every minute
  $$ SELECT public.manual_auction_status_update(); $$
);

-- Verification: Check that the new cron job is scheduled
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'auction-status-update-every-minute';