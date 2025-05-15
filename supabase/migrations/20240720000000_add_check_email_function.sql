
-- Function to check if an email already exists with improved locking and transaction handling
CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Use a transaction and row locking to prevent race conditions
  BEGIN
    -- Check in auth.users table with locking
    SELECT EXISTS(
      SELECT 1 FROM auth.users 
      WHERE email = p_email
      FOR SHARE NOWAIT  -- Read lock without waiting
    ) INTO v_exists;
    
    -- Return the result
    RETURN jsonb_build_object(
      'exists', v_exists
    );
  EXCEPTION
    WHEN lock_not_available THEN
      -- If we can't get a lock immediately, assume it exists
      -- This prevents race conditions where someone is currently creating that user
      RETURN jsonb_build_object(
        'exists', true,
        'warning', 'Lock not available, assuming user exists to prevent race condition'
      );
  END;
END;
$$;

-- Revoke execute from public
REVOKE ALL ON FUNCTION check_email_exists FROM PUBLIC;

-- Grant execute to authenticated users and anon
GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated, anon, service_role;
