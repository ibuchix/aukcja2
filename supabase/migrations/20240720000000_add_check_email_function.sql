
-- Function to check if an email already exists
CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check in auth.users table
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = p_email
  ) INTO v_exists;
  
  -- Return the result
  RETURN jsonb_build_object(
    'exists', v_exists
  );
END;
$$;

-- Revoke execute from public
REVOKE ALL ON FUNCTION check_email_exists FROM PUBLIC;

-- Grant execute to authenticated users and anon
GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated, anon, service_role;
