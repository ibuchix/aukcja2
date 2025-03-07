
-- Function to get dealer profile by email
CREATE OR REPLACE FUNCTION public.get_dealer_by_email(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_dealer_data JSON;
BEGIN
  -- First get the user ID from auth.users by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Then fetch the dealer record using that user ID
  SELECT to_json(d)
  INTO v_dealer_data
  FROM public.dealers d
  WHERE d.user_id = v_user_id;
  
  RETURN v_dealer_data;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dealer_by_email TO authenticated;
