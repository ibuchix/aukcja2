-- Add cron job to process dealer email notifications every 2 minutes
SELECT cron.schedule(
  'process-dealer-email-notifications',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT net.http_post(
    url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/send-dealer-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Also create a manual test function for dealer email processing
CREATE OR REPLACE FUNCTION public.test_dealer_email_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Call the edge function via HTTP
  SELECT net.http_post(
    url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/send-dealer-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
    body := '{}'::jsonb
  ) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Test email notification processing triggered',
    'timestamp', NOW(),
    'response', v_result
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$;