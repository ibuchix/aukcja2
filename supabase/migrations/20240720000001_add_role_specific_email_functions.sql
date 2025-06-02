
-- Function to check if an email exists specifically for dealer role
CREATE OR REPLACE FUNCTION check_email_exists_for_dealer_role(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN := false;
  v_has_dealer_role BOOLEAN := false;
  v_user_id UUID;
  v_existing_roles TEXT[];
BEGIN
  -- Check if email exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Email exists, now check if they have dealer role
    SELECT EXISTS(
      SELECT 1 FROM profiles p
      WHERE p.id = v_user_id AND p.role = 'dealer'
    ) INTO v_has_dealer_role;
    
    -- Also check if they exist in dealers table
    IF NOT v_has_dealer_role THEN
      SELECT EXISTS(
        SELECT 1 FROM dealers d
        WHERE d.user_id = v_user_id
      ) INTO v_has_dealer_role;
    END IF;
    
    -- Get all existing roles for this user
    SELECT array_agg(DISTINCT role_name) INTO v_existing_roles
    FROM (
      SELECT p.role::text as role_name FROM profiles p WHERE p.id = v_user_id
      UNION
      SELECT 'seller' as role_name FROM sellers s WHERE s.user_id = v_user_id
      UNION  
      SELECT 'dealer' as role_name FROM dealers d WHERE d.user_id = v_user_id
    ) roles;
    
    v_exists = v_has_dealer_role;
  END IF;
  
  -- Return detailed information
  RETURN jsonb_build_object(
    'exists', v_exists,
    'has_dealer_role', v_has_dealer_role,
    'email_registered', (v_user_id IS NOT NULL),
    'existing_roles', COALESCE(v_existing_roles, ARRAY[]::TEXT[])
  );
END;
$$;

-- Function to check if an email exists specifically for seller role
CREATE OR REPLACE FUNCTION check_email_exists_for_seller_role(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN := false;
  v_has_seller_role BOOLEAN := false;
  v_user_id UUID;
  v_existing_roles TEXT[];
BEGIN
  -- Check if email exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Email exists, now check if they have seller role
    SELECT EXISTS(
      SELECT 1 FROM profiles p
      WHERE p.id = v_user_id AND p.role = 'seller'
    ) INTO v_has_seller_role;
    
    -- Also check if they exist in sellers table
    IF NOT v_has_seller_role THEN
      SELECT EXISTS(
        SELECT 1 FROM sellers s
        WHERE s.user_id = v_user_id
      ) INTO v_has_seller_role;
    END IF;
    
    -- Get all existing roles for this user
    SELECT array_agg(DISTINCT role_name) INTO v_existing_roles
    FROM (
      SELECT p.role::text as role_name FROM profiles p WHERE p.id = v_user_id
      UNION
      SELECT 'seller' as role_name FROM sellers s WHERE s.user_id = v_user_id
      UNION  
      SELECT 'dealer' as role_name FROM dealers d WHERE d.user_id = v_user_id
    ) roles;
    
    v_exists = v_has_seller_role;
  END IF;
  
  -- Return detailed information
  RETURN jsonb_build_object(
    'exists', v_exists,
    'has_seller_role', v_has_seller_role,
    'email_registered', (v_user_id IS NOT NULL),
    'existing_roles', COALESCE(v_existing_roles, ARRAY[]::TEXT[])
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_email_exists_for_dealer_role TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION check_email_exists_for_seller_role TO authenticated, anon, service_role;
