
-- This migration ensures that service role has proper access to dealer profiles
-- and improves the reliability of the dealer profile retrieval process

-- 1. Create a security definer function to get dealer profile by user ID
-- This prevents permission issues when accessing the dealers table
CREATE OR REPLACE FUNCTION get_dealer_by_user_id(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges, bypassing RLS
AS $$
DECLARE
  v_dealer_data JSONB;
BEGIN
  SELECT to_jsonb(d)
  INTO v_dealer_data
  FROM public.dealers d
  WHERE d.user_id = p_user_id;
  
  RETURN v_dealer_data;
END;
$$;

-- 2. Grant execute permissions to specific roles
REVOKE ALL ON FUNCTION get_dealer_by_user_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_dealer_by_user_id TO service_role;
GRANT EXECUTE ON FUNCTION get_dealer_by_user_id TO authenticated;

-- 3. Add an index to improve performance of dealer lookups by user_id
-- This helps with the frequent dealer profile lookups in auth flows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'dealers' AND indexname = 'dealers_user_id_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS dealers_user_id_idx ON public.dealers(user_id);
  END IF;
END
$$;

-- 4. Ensure the dealer_otps table has proper RLS policies
-- This allows service role to manage OTPs
ALTER TABLE IF EXISTS public.dealer_otps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dealer_otps' AND policyname = 'Service role can manage all dealer_otps'
  ) THEN
    CREATE POLICY "Service role can manage all dealer_otps"
    ON public.dealer_otps
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;

-- Make sure service role policy exists for dealers table with correct definition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dealers' AND policyname = 'Service role can manage all dealers'
  ) THEN
    CREATE POLICY "Service role can manage all dealers"
    ON public.dealers
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;

COMMENT ON FUNCTION get_dealer_by_user_id IS 'Securely retrieves dealer information by user ID with elevated privileges';
