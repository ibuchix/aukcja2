-- Remove any existing conflicting cron jobs
SELECT cron.unschedule('update-auction-status');
SELECT cron.unschedule('auction-status-updater');
SELECT cron.unschedule('auction-outcome-processor');

-- Create new cron job to process auction outcomes every minute
SELECT cron.schedule(
  'auction-outcome-processor',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/update-auction-outcomes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Log the cron job creation
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'cron_setup', 
  'Auction outcome processor cron job created', 
  jsonb_build_object(
    'schedule', '* * * * *',
    'function', 'update-auction-outcomes',
    'created_at', now()
  )
);