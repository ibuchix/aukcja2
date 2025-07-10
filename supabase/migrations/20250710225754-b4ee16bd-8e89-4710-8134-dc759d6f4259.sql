-- Fix critical RLS security issue on dealer_won_vehicles table
-- This migration re-enables RLS and removes excessive permissions

-- First, revoke all the excessive permissions that bypass RLS
REVOKE ALL ON public.dealer_won_vehicles FROM anon;
REVOKE ALL ON public.dealer_won_vehicles FROM authenticated;
REVOKE ALL ON public.dealer_won_vehicles FROM authenticator;

-- Re-enable Row Level Security
ALTER TABLE public.dealer_won_vehicles ENABLE ROW LEVEL SECURITY;

-- Grant only the necessary permissions to authenticated users
-- They will be restricted by RLS policies
GRANT SELECT ON public.dealer_won_vehicles TO authenticated;
GRANT INSERT ON public.dealer_won_vehicles TO authenticated;
GRANT UPDATE ON public.dealer_won_vehicles TO authenticated;

-- Ensure service_role keeps full access for system operations
GRANT ALL ON public.dealer_won_vehicles TO service_role;

-- Verify the existing policies are in place and working
-- The policies should already exist from previous migrations:
-- 1. "Dealers can view their own won vehicles" - for SELECT
-- 2. "Admins can manage dealer won vehicles" - for ALL operations

-- Test the RLS is working by checking policy existence
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'dealer_won_vehicles' 
    AND schemaname = 'public';
    
    IF policy_count < 2 THEN
        RAISE EXCEPTION 'Expected RLS policies are missing. Found % policies, expected at least 2', policy_count;
    END IF;
    
    RAISE NOTICE 'RLS policies verified: % policies found for dealer_won_vehicles', policy_count;
END $$;

-- Log the security fix
INSERT INTO system_logs (
    log_type, 
    message, 
    details
) VALUES (
    'security_fix',
    'Re-enabled RLS on dealer_won_vehicles table and removed excessive permissions',
    jsonb_build_object(
        'table', 'dealer_won_vehicles',
        'action', 'rls_enabled',
        'permissions_revoked', true,
        'timestamp', NOW()
    )
);