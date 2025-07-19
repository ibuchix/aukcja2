-- Drop all versions of the update_auction_status function
DROP FUNCTION IF EXISTS public.update_auction_status() CASCADE;
DROP FUNCTION IF EXISTS public.update_auction_status(text) CASCADE;
DROP FUNCTION IF EXISTS public.update_auction_status(integer) CASCADE;