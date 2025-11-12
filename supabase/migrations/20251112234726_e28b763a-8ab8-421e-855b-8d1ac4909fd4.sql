-- ============================================================================
-- STEP 3: OPTIMIZE NOTIFICATIONS - Reduce from 30 min to 5 min
-- ============================================================================
-- This migration:
-- 1. Removes old 30-minute notification cron jobs
-- 2. Creates new 5-minute notification jobs
-- 3. Ensures dealers and sellers receive timely notifications
-- ============================================================================

-- 3.1: Remove old 30-minute notification cron jobs
SELECT cron.unschedule('process-dealer-post-seller-decisions');
SELECT cron.unschedule('trigger-seller-email-notifications');

-- 3.2: Create new 5-minute dealer notification job
-- This sends notifications to dealers about won vehicles
SELECT cron.schedule(
  'send-dealer-notifications',
  '*/5 * * * *',  -- Runs every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/send-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MTA5MTgsImV4cCI6MjA1MTQ4NjkxOH0.rJ9yHoEBYOmB9LKvMkHtZmhWZi7hCDKGiVaXN9uyhrI"}'::jsonb,
    body:=('{"time": "' || now() || '"}')::jsonb
  ) as request_id;
  $$
);

-- 3.3: Create new 5-minute seller decision processing job
-- This processes seller accept/reject decisions and updates dealer_won_vehicles
SELECT cron.schedule(
  'process-seller-decisions',
  '*/5 * * * *',  -- Runs every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/process-seller-decisions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MTA5MTgsImV4cCI6MjA1MTQ4NjkxOH0.rJ9yHoEBYOmB9LKvMkHtZmhWZi7hCDKGiVaXN9uyhrI"}'::jsonb,
    body:=('{"time": "' || now() || '"}')::jsonb
  ) as request_id;
  $$
);

-- Verification: Check that the new cron jobs are scheduled
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname IN ('send-dealer-notifications', 'process-seller-decisions');