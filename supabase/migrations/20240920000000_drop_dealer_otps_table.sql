
-- Drop the dealer_otps table as it's no longer needed
DROP TABLE IF EXISTS public.dealer_otps;

-- Drop any functions related to OTP management
DROP FUNCTION IF EXISTS public.store_dealer_otp;
DROP FUNCTION IF EXISTS public.cleanup_expired_otps;
