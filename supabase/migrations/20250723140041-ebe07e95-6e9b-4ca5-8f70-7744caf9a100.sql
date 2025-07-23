-- Safely remove existing cron jobs (ignore errors if they don't exist)
DO $$
BEGIN
  -- Try to unschedule each job, ignore errors if they don't exist
  BEGIN
    PERFORM cron.unschedule('process-ended-auctions-workflow');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
  
  BEGIN
    PERFORM cron.unschedule('auction-status-sync');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
  
  BEGIN
    PERFORM cron.unschedule('auction-consistency-check');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
  
  BEGIN
    PERFORM cron.unschedule('auction-outcome-processor');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
  
  BEGIN
    PERFORM cron.unschedule('auction-outcomes-processor');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
  
  BEGIN
    PERFORM cron.unschedule('comprehensive-auction-processing');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
  
  BEGIN
    PERFORM cron.unschedule('process-dealer-email-notifications');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
  END;
END $$;

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