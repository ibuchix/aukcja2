
-- Function to get a user ID by email (safely)
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Lookup the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- Return the result
  RETURN jsonb_build_object(
    'id', v_user_id
  );
END;
$$;

-- Revoke execute from public
REVOKE ALL ON FUNCTION get_user_id_by_email FROM PUBLIC;

-- Grant execute to authenticated users, anon and service_role
GRANT EXECUTE ON FUNCTION get_user_id_by_email TO authenticated, anon, service_role;
