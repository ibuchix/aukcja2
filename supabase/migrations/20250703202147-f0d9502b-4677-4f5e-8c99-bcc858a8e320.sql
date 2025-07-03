-- Completely disable RLS and drop all policies on dealer_won_vehicles
ALTER TABLE public.dealer_won_vehicles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins have full access to dealer_won_vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Enable access for authenticated users to their dealer_won_vehic" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Service role can manage all dealer_won_vehicles" ON public.dealer_won_vehicles;

-- Grant explicit permissions to all roles
GRANT ALL ON public.dealer_won_vehicles TO anon;
GRANT ALL ON public.dealer_won_vehicles TO authenticated;
GRANT ALL ON public.dealer_won_vehicles TO service_role;

-- Verify table is accessible
SELECT 'RLS disabled and permissions granted' as status;