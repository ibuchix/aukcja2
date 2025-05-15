
-- Create a function to handle the entire dealer creation process atomically with better error handling
CREATE OR REPLACE FUNCTION create_dealer_with_profile(
  p_email text,
  p_password text,
  p_supervisor_name text,
  p_company_name text,
  p_tax_id text,
  p_business_registry_number text,
  p_address text,
  p_phone_number text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with definer's permissions
SET search_path = public 
AS $$
DECLARE
  v_user_id uuid;
  v_user json;
  v_profile_exists boolean;
  v_email_exists boolean;
BEGIN
  -- Start explicit transaction with serializable isolation level
  -- to prevent race conditions during dealer creation
  BEGIN
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    
    -- Check if user exists first with proper locking
    SELECT EXISTS(
      SELECT 1 FROM auth.users
      WHERE email = p_email
      FOR UPDATE SKIP LOCKED  -- Skip if locked rather than waiting
    ) INTO v_email_exists;

    IF v_email_exists THEN
      RAISE EXCEPTION 'User with this email already exists' USING ERRCODE = 'unique_violation';
    END IF;

    -- Create the auth user
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data
    )
    VALUES (
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'name', p_supervisor_name,
        'phone_number', p_phone_number
      )
    )
    RETURNING id, raw_user_meta_data INTO v_user_id, v_user;

    -- Check if profile exists before creating
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;

    -- Only create profile if it doesn't exist
    IF NOT v_profile_exists THEN
      -- Create basic profile
      INSERT INTO profiles (
        id,
        role,
        full_name,
        updated_at
      ) VALUES (
        v_user_id,
        'dealer',
        p_supervisor_name,
        now()
      );
    END IF;

    -- Create dealer profile
    INSERT INTO dealers (
      user_id,
      supervisor_name,
      dealership_name,
      tax_id,
      business_registry_number,
      address,
      verification_status,
      is_verified,
      license_number,
      phone_number,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_supervisor_name,
      p_company_name,
      p_tax_id,
      p_business_registry_number,
      p_address,
      'pending',
      false,
      p_business_registry_number,
      p_phone_number,
      now(),
      now()
    );

    -- Return success response
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'id', v_user_id,
        'email', p_email,
        'user_metadata', v_user
      )
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Handle duplicate key specifically
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'unique_violation'
      );
    WHEN deadlock_detected THEN
      -- Handle deadlock specifically
      RETURN json_build_object(
        'success', false,
        'error', 'Transaction deadlock detected. Please try again.',
        'error_code', 'deadlock'
      );
    WHEN serialization_failure THEN
      -- Handle serialization failure specifically
      RETURN json_build_object(
        'success', false,
        'error', 'Concurrent modification detected. Please try again.',
        'error_code', 'serialization_failure'
      );
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;
