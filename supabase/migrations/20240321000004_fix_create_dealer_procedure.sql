
-- Create a function to handle the entire dealer creation process atomically with better error handling
create or replace function create_dealer_with_profile(
  p_email text,
  p_password text,
  p_supervisor_name text,
  p_company_name text,
  p_tax_id text,
  p_business_registry_number text,
  p_address text
) returns json
language plpgsql
security definer -- Run with definer's permissions
as $$
declare
  v_user_id uuid;
  v_user json;
  v_profile_exists boolean;
begin
  -- Start transaction
  begin
    -- Check if user exists first (using auth schema)
    select id, raw_user_meta_data
    into v_user_id, v_user
    from auth.users
    where email = p_email;

    if v_user_id is not null then
      raise exception 'User with this email already exists';
    end if;

    -- Create the auth user with more robust error handling
    begin
      insert into auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data
      )
      values (
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        jsonb_build_object('name', p_supervisor_name)
      )
      returning id, raw_user_meta_data into v_user_id, v_user;
    exception 
      when others then
        return json_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE,
          'operation', 'auth_user_insert'
        );
    end;

    -- Verify user was created successfully
    if v_user_id is null then
      return json_build_object(
        'success', false,
        'error', 'Failed to create user account',
        'error_code', 'user_creation_failed'
      );
    end;

    -- Check if profile exists before creating (with exponential backoff)
    for i in 1..3 loop -- try up to 3 times with increasing delay
      select exists(select 1 from profiles where id = v_user_id) into v_profile_exists;
      
      if v_profile_exists then
        exit; -- profile exists, exit the loop
      end if;
      
      -- Sleep for progressively longer intervals (10ms, 100ms, 1000ms)
      perform pg_sleep(power(10, i-1) * 0.01);
    end loop;

    -- Only create profile if it doesn't exist
    if not v_profile_exists then
      begin
        -- Create basic profile
        insert into profiles (
          id,
          role,
          full_name,
          updated_at
        ) values (
          v_user_id,
          'dealer',
          p_supervisor_name,
          now()
        );
      exception
        when unique_violation then
          -- Profile already exists, this is fine
          null;
        when others then
          return json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'operation', 'profile_insert'
          );
      end;
    end if;

    -- Create dealer profile
    begin
      insert into dealers (
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
      ) values (
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
    exception
      when others then
        return json_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE,
          'operation', 'dealer_insert'
        );
    end;

    -- Return success response
    return json_build_object(
      'success', true,
      'user', json_build_object(
        'id', v_user_id,
        'email', p_email,
        'user_metadata', v_user
      )
    );

    exception
      when unique_violation then
        -- Handle duplicate key specifically
        return json_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', 'unique_violation'
        );
      when others then
        -- Rollback will happen automatically
        return json_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE,
          'operation', 'transaction'
        );
  end;
end;
$$;

-- Grant execute permissions to service role only
REVOKE ALL ON FUNCTION create_dealer_with_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_dealer_with_profile TO service_role;
