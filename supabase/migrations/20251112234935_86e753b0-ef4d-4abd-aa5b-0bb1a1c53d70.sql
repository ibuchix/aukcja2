-- ============================================================================
-- STEP 4: IMPLEMENT LOG CLEANUP - Disk Space Management
-- ============================================================================
-- This migration:
-- 1. Creates hourly cleanup for auction_status_sync logs (48-hour retention)
-- 2. Creates cleanup every 72 hours at 2 AM UTC for all logs (7-day retention)
-- 3. Prevents disk space issues from excessive logging
-- ============================================================================

-- 4.1: Hourly cleanup for auction_status_sync logs (keep 48 hours)
-- These logs are generated every minute, so frequent cleanup is needed
SELECT cron.schedule(
  'cleanup-auction-sync-logs-hourly',
  '0 * * * *',  -- Runs every hour at minute 0
  $$
  DELETE FROM system_logs 
  WHERE log_type = 'auction_status_sync' 
  AND created_at < NOW() - INTERVAL '48 hours';
  $$
);

-- 4.2: Cleanup all logs every 72 hours at 2 AM UTC (keep 7 days)
-- Runs every 3 days at 2 AM UTC to clean old logs
SELECT cron.schedule(
  'cleanup-old-logs-every-72h',
  '0 2 */3 * *',  -- Every 3 days at 2:00 AM UTC
  $$
  DELETE FROM system_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  $$
);

-- Verification: Check that the cleanup jobs are scheduled
SELECT 
  jobname, 
  schedule, 
  SUBSTRING(command, 1, 80) || '...' as command_preview
FROM cron.job 
WHERE jobname IN ('cleanup-auction-sync-logs-hourly', 'cleanup-old-logs-every-72h');