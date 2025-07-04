-- Phase 1: Fix current stuck BMW auction and payment data

-- Update the BMW auction schedule from running to completed
UPDATE auction_schedules 
SET 
  status = 'completed',
  last_status_change = NOW(),
  updated_at = NOW()
WHERE status = 'running' 
  AND end_time < NOW();

-- Update the BMW car auction status to sold if bid meets reserve
UPDATE cars
SET 
  auction_status = 'sold',
  updated_at = NOW()
WHERE id = '67f5091c-057c-4637-adde-82b9ead9dd4f'
  AND current_bid >= reserve_price;

-- Verify payment for the BMW if payment was successful
-- (This will be handled by the enhanced verify-payment-status function)

-- Clean up cron jobs - remove non-existent functions and add proper ones
SELECT cron.unschedule('process-auction-results');
SELECT cron.unschedule('proxy-bid-processor');

-- Add proper auction processing cron job that calls our working function
SELECT cron.schedule(
  'auction-outcomes-processor',
  '* * * * *', -- every minute
  $$
  SELECT net.http_post(
    url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/update-auction-outcomes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);