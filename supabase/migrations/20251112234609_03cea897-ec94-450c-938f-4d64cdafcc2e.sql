-- ============================================================================
-- STEP 2: FIX WINNER DETERMINATION - Optimize from 30 min to 2 min
-- ============================================================================
-- This migration:
-- 1. Removes old 30-minute winner determination cron jobs
-- 2. Creates new 2-minute cron job for winner processing
-- 3. Ensures winners are determined within 2 minutes of auction end
-- ============================================================================

-- 2.1: Remove old 30-minute winner determination cron jobs
SELECT cron.unschedule('update-auction-outcomes-edge-function');
SELECT cron.unschedule('process-seller-auction-end');

-- 2.2: Create new 2-minute winner processing cron job
-- This calls the secure winner determination function
SELECT cron.schedule(
  'process-auction-winners',
  '*/2 * * * *',  -- Runs every 2 minutes
  $$ SELECT public.process_ended_auctions_securely(); $$
);

-- Verification: Check that the new cron job is scheduled
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'process-auction-winners';