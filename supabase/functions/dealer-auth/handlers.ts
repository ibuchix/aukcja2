
import { SupabaseClient } from '@supabase/supabase-js';
import { createErrorResponse, createSuccessResponse } from './response-utils.ts';
import { logError, logInfo } from './logging.ts';
import { LoginRequest, RegisterRequest, EmailCheckRequest } from './types.ts';

export const checkEmailExists = async (
  supabase: SupabaseClient,
  request: EmailCheckRequest
): Promise<Response> => {
  try {
    const { email } = request;
    logInfo(`Checking if email exists: ${email}`);
    
    let exists = false;
    
    try {
      logInfo('Checking email using RPC function');
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'check_email_exists',
        { email_to_check: email }
      );
      
      if (!rpcError && rpcResult) {
        exists = rpcResult.exists === true;
        logInfo(`RPC check result: ${exists}`);
        return createSuccessResponse({ exists });
      }
      
      if (rpcError) {
        logError('RPC check failed:', rpcError);
        // Fall through to next method
      }
    } catch (err) {
      logError('Error in RPC check:', err);
      // Fall through to next method
    }
    
    try {
      logInfo('Checking email using auth admin API');
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
        filters: {
          email: email
        }
      });
      
      if (!userError && userData && userData.users && userData.users.length > 0) {
        exists = true;
        logInfo(`Admin API check result: ${exists}`);
        return createSuccessResponse({ exists });
      }
      
      if (userError) {
        logError('Admin API check failed:', userError);
        // Fall through to next method
      }
    } catch (err) {
      logError('Error in admin API check:', err);
      // Fall through to next method
    }
    
    try {
      logInfo('Checking email using direct SQL query');
      const { data: queryResult, error: queryError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .limit(1);
      
      if (!queryError && queryResult && queryResult.length > 0) {
        exists = true;
        logInfo(`SQL query check result: ${exists}`);
        return createSuccessResponse({ exists });
      }
      
      if (queryError) {
        logError('SQL query check failed:', queryError);
        // Fall through to final method
      }
    } catch (err) {
      logError('Error in SQL query check:', err);
      // Fall through to final method
    }
    
    try {
      logInfo('Checking email using signIn attempt');
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'ThIsShOuLdNoTmAtCh!123',
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed')) {
          exists = true;
        } else if (error.message.includes('User not found')) {
          exists = false;
        } else {
          logError('Unexpected error in signIn check:', error);
        }
      }
      
      logInfo(`SignIn attempt check result: ${exists}`);
    } catch (err) {
      logError('Error in signIn attempt check:', err);
    }
    
    return createSuccessResponse({ exists });
    
  } catch (error) {
    logError('Error checking for existing user', error);
    return createErrorResponse('Failed to check if email exists', 500);
  }
};

export const registerUser = async (
  supabase: SupabaseClient,
  request: RegisterRequest
): Promise<Response> => {
  try {
    const { email, password, metadata } = request;
    
    let userExists = false;
    
    try {
      const { data: existsData, error: existsError } = await supabase.rpc(
        'check_email_exists',
        { email_to_check: email }
      );
      
      if (!existsError && existsData) {
        userExists = existsData.exists === true;
      } else {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1,
          filters: {
            email: email
          }
        });
        
        userExists = !userError && userData && userData.users && userData.users.length > 0;
      }
    } catch (err) {
      logError('Error checking if user exists:', err);
    }
    
    if (userExists) {
      logError('User already exists during registration attempt');
      return createErrorResponse('User with this email already exists', 409);
    }
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: metadata || {}
    });
    
    if (authError) {
      logError('Error creating user:', authError);
      return createErrorResponse(
        authError.message || 'Failed to create user',
        authError.status || 500
      );
    }
    
    if (!authData || !authData.user) {
      logError('No user data returned from auth.admin.createUser');
      return createErrorResponse('Failed to create user account', 500);
    }
    
    if (metadata && metadata.companyName) {
      try {
        const { data: dealerData, error: dealerError } = await supabase.rpc(
          'create_dealer_with_profile',
          {
            p_email: email,
            p_password: password,
            p_supervisor_name: metadata.name || '',
            p_company_name: metadata.companyName || '',
            p_tax_id: metadata.taxId || '',
            p_business_registry_number: metadata.businessRegistryNumber || '',
            p_address: metadata.companyAddress || ''
          }
        );
        
        if (dealerError) {
          logError('Error creating dealer profile via RPC:', dealerError);
        } else {
          logInfo('Dealer profile created successfully via RPC');
        }
      } catch (err) {
        logError('Exception during dealer profile creation:', err);
      }
    }
    
    return createSuccessResponse({
      success: true,
      message: 'User registered successfully',
      userId: authData.user.id,
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });
    
  } catch (error) {
    logError('Unexpected error during registration:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
};

export const loginUser = async (
  supabase: SupabaseClient,
  request: LoginRequest
): Promise<Response> => {
  try {
    logInfo(`Login attempt for: ${request.email}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });
    
    if (authError) {
      logError('Login error:', authError);
      return createErrorResponse(
        authError.message || 'Authentication failed',
        authError.status || 401
      );
    }
    
    if (!authData || !authData.session) {
      logError('No session returned from signInWithPassword');
      return createErrorResponse('Authentication failed - no session created', 401);
    }
    
    const userId = authData.user.id;
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (dealerError && dealerError.code !== 'PGRST116') {
      logError('Error fetching dealer profile:', dealerError);
    }
    
    return createSuccessResponse({
      success: true,
      session: authData.session,
      dealer: dealerData || null
    });
    
  } catch (error) {
    logError('Unexpected error during login:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
};
