-- Complete RLS policy simplification

-- DEALERS TABLE: Replace complex policies with 2 simple ones
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
ALTER TABLE seller_bid_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view seller decisions for won vehicles" 
ON seller_bid_decisions FOR SELECT
USING (car_id IN (SELECT car_id FROM dealer_won_vehicles WHERE dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())));

CREATE POLICY "Admins have full access to seller decisions" 
ON seller_bid_decisions FOR ALL
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));