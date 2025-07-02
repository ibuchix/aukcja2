-- Temporarily disable RLS to allow access while we create a working solution
ALTER TABLE public.dealer_won_vehicles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS and create a comprehensive policy that handles all authentication states
ALTER TABLE public.dealer_won_vehicles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Dealers can view their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Dealers can insert their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Dealers can update their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Admins have full access to dealer_won_vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Service role can manage all dealer_won_vehicles" ON public.dealer_won_vehicles;

-- Create a single comprehensive policy that works with the current setup
CREATE POLICY "Enable access for authenticated users to their dealer_won_vehicles"
ON public.dealer_won_vehicles
FOR ALL
USING (
  -- Allow if user is admin
  is_admin() OR
  -- Allow if user is the dealer owner (using security definer function)
  dealer_id = public.get_dealer_id_by_user_id(auth.uid()) OR
  -- Allow if auth context is missing but this is a valid dealer record
  (auth.uid() IS NOT NULL AND dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
)
WITH CHECK (
  -- Allow if user is admin
  is_admin() OR
  -- Allow if user is the dealer owner
  dealer_id = public.get_dealer_id_by_user_id(auth.uid()) OR
  -- Allow if auth context is missing but this is a valid dealer record
  (auth.uid() IS NOT NULL AND dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
);

-- Keep admin and service role policies
CREATE POLICY "Admins have full access to dealer_won_vehicles"
ON public.dealer_won_vehicles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Service role can manage all dealer_won_vehicles"
ON public.dealer_won_vehicles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);