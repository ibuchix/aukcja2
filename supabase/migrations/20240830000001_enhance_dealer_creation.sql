
-- Enhance the dealer creation function to be more reliable
CREATE OR REPLACE FUNCTION public.create_dealer_with_profile(
  p_email text, 
  p_password text, 
  p_supervisor_name text, 
  p_company_name text, 
  p_tax_id text, 
  p_business_registry_number text, 
  p_address text, 
  p_phone_number text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user json;
  v_profile_exists boolean;
  v_dealer_exists boolean;
BEGIN
  -- Check if user exists first (using auth schema)
  SELECT id, raw_user_meta_data
  INTO v_user_id, v_user
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Create the auth user with more robust error handling
  BEGIN
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
        'phone_number', p_phone_number,
        'role', 'dealer'
      )
    )
    RETURNING id, raw_user_meta_data INTO v_user_id, v_user;
  EXCEPTION 
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE,
        'operation', 'auth_user_insert'
      );
  END;

  -- Verify user was created successfully
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create user account',
      'error_code', 'user_creation_failed'
    );
  END IF;

  -- Check if profile exists before creating
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;
  
  -- Check if dealer record exists
  SELECT EXISTS(SELECT 1 FROM dealers WHERE user_id = v_user_id) INTO v_dealer_exists;

  -- Create profile if it doesn't exist
  IF NOT v_profile_exists THEN
    BEGIN
      -- Create profile with dealer role
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
    EXCEPTION
      WHEN unique_violation THEN
        -- Profile already exists, this is fine
        NULL;
      WHEN others THEN
        RETURN json_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE,
          'operation', 'profile_insert'
        );
    END;
  END IF;

  -- Create or update dealer record
  BEGIN
    IF NOT v_dealer_exists THEN
      -- Create new dealer record
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
        now(),
        now()
      );
    ELSE
      -- Update existing dealer record
      UPDATE dealers SET
        supervisor_name = p_supervisor_name,
        dealership_name = p_company_name,
        tax_id = p_tax_id,
        business_registry_number = p_business_registry_number,
        address = p_address,
        updated_at = now()
      WHERE user_id = v_user_id;
    END IF;
  EXCEPTION
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE,
        'operation', 'dealer_upsert'
      );
  END;

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
  WHEN others THEN
    -- Rollback will happen automatically
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'operation', 'transaction'
    );
END;
$$;
