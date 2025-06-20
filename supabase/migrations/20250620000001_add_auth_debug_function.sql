
-- Add debugging function to test authentication context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_dealer_record RECORD;
  v_result jsonb;
BEGIN
  -- Get the current user ID from auth context
  v_user_id := auth.uid();
  
  -- If no user ID, return early
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'auth_uid', NULL,
      'has_auth', false,
      'error', 'No authentication context'
    );
  END IF;
  
  -- Try to get dealer record
  SELECT 
    id,
    user_id,
    dealership_name,
    is_verified,
    verification_status
  INTO v_dealer_record
  FROM dealers
  WHERE user_id = v_user_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'auth_uid', v_user_id,
    'has_auth', true,
    'dealer_exists', v_dealer_record.id IS NOT NULL
  );
  
  -- Add dealer info if found
  IF v_dealer_record.id IS NOT NULL THEN
    v_result := v_result || jsonb_build_object(
      'dealer_id', v_dealer_record.id,
      'dealership_name', v_dealer_record.dealership_name,
      'is_verified', v_dealer_record.is_verified,
      'verification_status', v_dealer_record.verification_status
    );
  END IF;
  
  RETURN v_result;
END;
$$;
