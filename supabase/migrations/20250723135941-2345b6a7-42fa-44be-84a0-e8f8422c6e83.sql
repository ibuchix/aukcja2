-- Remove all existing broken cron jobs that call non-existent functions
SELECT cron.unschedule('process-ended-auctions-workflow');
SELECT cron.unschedule('auction-status-sync');
SELECT cron.unschedule('auction-consistency-check');
SELECT cron.unschedule('auction-outcome-processor');
SELECT cron.unschedule('auction-outcomes-processor');
SELECT cron.unschedule('comprehensive-auction-processing');
SELECT cron.unschedule('process-dealer-email-notifications');

-- Create the correct cron job that calls the working update-auction-outcomes edge function
SELECT cron.schedule(
  'update-auction-outcomes-edge-function',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT net.http_post(
    url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/update-auction-outcomes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
    body := '{"automated": true}'::jsonb
  );
  $$
);

-- Log the cron job fix
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'cron_jobs_fixed', 
  'Removed broken cron jobs and created correct edge function caller', 
  jsonb_build_object(
    'schedule', '*/2 * * * *',
    'function', 'update-auction-outcomes',
    'fixed_at', now()
  )
);