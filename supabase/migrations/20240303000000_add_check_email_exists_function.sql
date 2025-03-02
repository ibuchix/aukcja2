
-- This function safely checks if an email exists in the auth.users table
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE email = email_to_check;
  
  RETURN user_count;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION check_email_exists TO service_role;

