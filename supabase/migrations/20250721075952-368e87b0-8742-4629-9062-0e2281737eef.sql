-- Clean up the overcomplicated email notification system
-- Keep only the simple trigger-based system

-- 1. Remove email-related cron jobs
SELECT cron.unschedule('process-dealer-email-notifications');
SELECT cron.unschedule('process-dealer-post-seller-decisions');

-- 2. Drop complex email processing functions
DROP FUNCTION IF EXISTS public.process_dealer_post_seller_decision();
DROP FUNCTION IF EXISTS public.trigger_dealer_post_seller_decision();
DROP FUNCTION IF EXISTS public.test_dealer_email_notifications();
DROP FUNCTION IF EXISTS public.trigger_seller_email_notifications();

-- 3. Drop the related trigger
DROP TRIGGER IF EXISTS trigger_process_dealer_after_seller_decision ON seller_bid_decisions;

-- 4. Remove unnecessary email tracking columns from cars table
ALTER TABLE public.cars 
DROP COLUMN IF EXISTS email_notification_sent,
DROP COLUMN IF EXISTS email_sent_at;

-- 5. Clean up old email logs to avoid confusion
DELETE FROM system_logs 
WHERE log_type IN (
  'dealer_email_processing',
  'dealer_post_seller_decision',
  'dealer_email_notifications',
  'email_duplication_fix'
);

-- Log the cleanup
INSERT INTO system_logs (
  log_type,
  message,
  details
) VALUES (
  'email_system_cleanup',
  'Removed complex email system, keeping only simple trigger-based notifications',
  jsonb_build_object(
    'removed_functions', ARRAY[
      'process_dealer_post_seller_decision',
      'trigger_dealer_post_seller_decision', 
      'test_dealer_email_notifications',
      'trigger_seller_email_notifications'
    ],
    'removed_cron_jobs', ARRAY[
      'process-dealer-email-notifications',
      'process-dealer-post-seller-decisions'
    ],
    'removed_columns', ARRAY['email_notification_sent', 'email_sent_at'],
    'kept_system', 'send_email_on_seller_accept() trigger + send-dealer-bid-accepted edge function',
    'timestamp', NOW()
  )
);