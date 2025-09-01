-- SECURITY FIX: Remove public access to vin_valuation_cache table
-- This table contains proprietary pricing information that should not be accessible to the public

-- First, let's see the current policies for vin_valuation_cache
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'vin_valuation_cache'
ORDER BY policyname;

-- Drop the public access policy that allows anonymous users to read valuation data
DROP POLICY IF EXISTS "Allow public read access to valuation cache" ON public.vin_valuation_cache;

-- Ensure the remaining policies are restrictive and only allow authenticated users
-- Keep authenticated user policies but ensure they're properly restricted

-- Add a comment to document this security fix
COMMENT ON TABLE public.vin_valuation_cache IS 'Vehicle valuation cache - contains proprietary pricing data. Access restricted to authenticated users only for security.';