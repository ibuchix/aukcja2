-- Phase 1: Complete Watchlist Feature Removal
-- Drop all RLS policies on dealer_watchlist table
DROP POLICY IF EXISTS "Dealers can view their own watchlist" ON public.dealer_watchlist;
DROP POLICY IF EXISTS "Dealers can insert into their watchlist" ON public.dealer_watchlist;
DROP POLICY IF EXISTS "Dealers can update their watchlist" ON public.dealer_watchlist;
DROP POLICY IF EXISTS "Dealers can delete from their watchlist" ON public.dealer_watchlist;

-- Drop the dealer_watchlist table completely
DROP TABLE IF EXISTS public.dealer_watchlist CASCADE;