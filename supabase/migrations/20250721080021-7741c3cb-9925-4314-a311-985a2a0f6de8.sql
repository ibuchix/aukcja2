-- Clean up the overcomplicated email notification system (Part 1)
-- Keep only the simple trigger-based system

-- 1. Drop complex email processing functions (cron jobs already removed)
DROP FUNCTION IF EXISTS public.process_dealer_post_seller_decision();
DROP FUNCTION IF EXISTS public.trigger_dealer_post_seller_decision();
DROP FUNCTION IF EXISTS public.test_dealer_email_notifications();
DROP FUNCTION IF EXISTS public.trigger_seller_email_notifications();

-- 2. Drop the related trigger
DROP TRIGGER IF EXISTS trigger_process_dealer_after_seller_decision ON seller_bid_decisions;

-- 3. Remove unnecessary email tracking columns from cars table
ALTER TABLE public.cars 
DROP COLUMN IF EXISTS email_notification_sent,
DROP COLUMN IF EXISTS email_sent_at;