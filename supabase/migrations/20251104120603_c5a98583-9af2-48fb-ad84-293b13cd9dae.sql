-- Create database function to safely query auth.users by email and join with dealers
-- This avoids pagination issues and allows edge functions to access auth.users
CREATE OR REPLACE FUNCTION get_user_and_dealer_by_email(p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  dealer_id UUID,
  dealership_name TEXT,
  tax_id TEXT,
  business_registry_number TEXT,
  supervisor_name TEXT,
  address TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email as user_email,
    d.id as dealer_id,
    d.dealership_name,
    d.tax_id,
    d.business_registry_number,
    d.supervisor_name,
    d.address
  FROM auth.users u
  INNER JOIN dealers d ON d.user_id = u.id
  WHERE u.email = p_email
  LIMIT 1;
END;
$$;