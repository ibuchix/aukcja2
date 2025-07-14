-- COMPREHENSIVE AUCTION SYSTEM CLEANUP & SIMPLIFICATION
-- Phase 1: Remove redundant cron jobs (keep only essential ones)

-- List current cron jobs first for reference
SELECT jobname, schedule, command FROM cron.job;

-- Remove redundant cron jobs (keep only essential 3)
-- Keep: update-auction-status, cleanup-expired-vin-reservations, cleanup-expired-otps
-- Remove all others that create conflicts and complexity
SELECT cron.unschedule('process-pending-proxy-bids');
SELECT cron.unschedule('start-scheduled-auctions');
SELECT cron.unschedule('complete-scheduled-auctions');
SELECT cron.unschedule('process-auction-outcomes');
SELECT cron.unschedule('close-ended-auctions');
SELECT cron.unschedule('transition-ended-auctions');
SELECT cron.unschedule('sync-auction-results');
SELECT cron.unschedule('update-seller-decisions');

-- Phase 2: Simplify RLS policies for key tables

-- DEALERS TABLE: Replace 22 complex policies with 2 simple ones
DROP POLICY IF EXISTS "Dealers can view their own dealer profile" ON dealers;
DROP POLICY IF EXISTS "Dealers can update their own dealer profile" ON dealers;
DROP POLICY IF EXISTS "Dealers can update their own profile" ON dealers;
DROP POLICY IF EXISTS "Dealers comprehensive access policy" ON dealers;
DROP POLICY IF EXISTS "Allow dealers to insert into dealers" ON dealers;
DROP POLICY IF EXISTS "Allow dealers to read own profile" ON dealers;
DROP POLICY IF EXISTS "Allow dealers to read their profile" ON dealers;
DROP POLICY IF EXISTS "Allow dealers to update their profile" ON dealers;
DROP POLICY IF EXISTS "Allow users to create own dealer profile" ON dealers;
DROP POLICY IF EXISTS "Allow users to read own dealer profiles" ON dealers;
DROP POLICY IF EXISTS "Allow users to update own dealer profile" ON dealers;
DROP POLICY IF EXISTS "Allow users to update own dealer profiles" ON dealers;
DROP POLICY IF EXISTS "Allow users to view own dealer profile" ON dealers;
DROP POLICY IF EXISTS "Users can update own dealer profile" ON dealers;
DROP POLICY IF EXISTS "Users can view own dealer profile" ON dealers;
DROP POLICY IF EXISTS "dealers_insert_own" ON dealers;
DROP POLICY IF EXISTS "dealers_select_own" ON dealers;
DROP POLICY IF EXISTS "dealers_update_own" ON dealers;
DROP POLICY IF EXISTS "admin_full_access" ON dealers;
DROP POLICY IF EXISTS "admin_full_access_dealers" ON dealers;
DROP POLICY IF EXISTS "Admins can delete dealers" ON dealers;
DROP POLICY IF EXISTS "Admins can insert dealers" ON dealers;
DROP POLICY IF EXISTS "Admins can update all dealers" ON dealers;
DROP POLICY IF EXISTS "Admins have full access to dealers" ON dealers;

-- Create simple dealer policies
CREATE POLICY "Dealers can manage own profile" 
ON dealers FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins have full access" 
ON dealers FOR ALL
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- CARS TABLE: Grant dealers access to won vehicles
CREATE POLICY "Dealers can view won vehicles" 
ON cars FOR SELECT
USING (id IN (SELECT car_id FROM dealer_won_vehicles WHERE dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())));

-- SELLER_BID_DECISIONS TABLE: Grant dealers read access to see seller decisions
-- First ensure RLS is enabled
ALTER TABLE seller_bid_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view seller decisions for won vehicles" 
ON seller_bid_decisions FOR SELECT
USING (car_id IN (SELECT car_id FROM dealer_won_vehicles WHERE dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())));

CREATE POLICY "Admins have full access to seller decisions" 
ON seller_bid_decisions FOR ALL
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Phase 3: Update dealer_won_vehicles payment status for awaiting seller decision
-- Change current "pending" status to "awaiting_seller_decision" for clarity
UPDATE dealer_won_vehicles 
SET payment_status = 'awaiting_seller_decision' 
WHERE payment_status = 'pending' 
AND seller_details_unlocked = false;