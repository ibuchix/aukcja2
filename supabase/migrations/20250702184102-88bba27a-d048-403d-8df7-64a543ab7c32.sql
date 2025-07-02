-- First, grant proper permissions to the authenticator role
GRANT ALL ON public.dealer_won_vehicles TO authenticator;

-- Also grant to anon role just in case
GRANT SELECT ON public.dealer_won_vehicles TO anon;

-- Force disable RLS properly
ALTER TABLE public.dealer_won_vehicles DISABLE ROW LEVEL SECURITY;

-- Verify the table permissions are set correctly
SELECT 'Permissions granted and RLS disabled' as status;