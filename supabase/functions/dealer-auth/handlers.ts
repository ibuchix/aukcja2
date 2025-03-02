
import { createClient } from '@supabase/supabase-js';
import { logDebug, logError, logInfo, logWarn } from './logging';
import { errorResponse, successResponse } from './response-utils';
import { 
  EmailCheckRequest, 
  EmailCheckResponse, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  UserMetadata 
} from './types';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Handles user registration via RPC and direct database access
 */
export async function handleRegister(req: RegisterRequest): Promise<RegisterResponse> {
  try {
    const { email, password, metadata } = req;
    
    logInfo('Processing registration request', { email });
    
    // Normalize inputs
    const normalizedEmail = email.trim().toLowerCase();
    
    // Validate core fields
    if (!normalizedEmail) {
      return errorResponse('Email is required') as RegisterResponse;
    }
    
    if (!password || password.length < 8) {
      return errorResponse('Password must be at least 8 characters') as RegisterResponse;
    }
    
    if (!metadata.name) {
      return errorResponse('Name is required') as RegisterResponse;
    }
    
    // Check if email exists using RPC for better performance and atomic operation
    const { data: emailCheck, error: checkError } = await supabase
      .rpc('check_email_exists', { p_email: normalizedEmail });
    
    if (checkError) {
      logError('Error checking email existence', { error: checkError });
      return errorResponse('Error checking account existence') as RegisterResponse;
    }
    
    if (emailCheck && emailCheck.exists) {
      logWarn('Registration attempted with existing email', { email: normalizedEmail });
      return errorResponse('An account with this email already exists. Please login instead.') as RegisterResponse;
    }
    
    // Create dealer with profile using the RPC function
    const { data: createResult, error: createError } = await supabase
      .rpc('create_dealer_with_profile', {
        p_email: normalizedEmail,
        p_password: password,
        p_supervisor_name: metadata.name.trim(),
        p_company_name: metadata.companyName?.trim() || '',
        p_tax_id: metadata.taxId?.trim() || '',
        p_business_registry_number: metadata.businessRegistryNumber?.trim() || '',
        p_address: metadata.companyAddress?.trim() || ''
      });
    
    if (createError) {
      logError('Error creating dealer account', { error: createError });
      
      // Check for specific error types
      if (createError.message.includes('already exists')) {
        return errorResponse('An account with this email already exists. Please login instead.') as RegisterResponse;
      }
      
      return errorResponse(`Registration failed: ${createError.message}`) as RegisterResponse;
    }
    
    if (!createResult || !createResult.success) {
      const errMsg = createResult?.error || 'Registration failed for unknown reasons';
      logError('Registration failed', { result: createResult });
      return errorResponse(errMsg) as RegisterResponse;
    }
    
    // Registration successful
    logInfo('Registration successful', { userId: createResult.user?.id });
    
    // Send welcome email (would be handled separately)
    try {
      await supabase.functions.invoke('send-dealer-welcome', {
        body: { email: normalizedEmail, name: metadata.name }
      });
    } catch (emailError) {
      // Non-critical error, log but continue
      logWarn('Failed to send welcome email', { error: emailError });
    }
    
    return successResponse({
      user: createResult.user
    }, 'Registration successful. Please check your email for verification.') as RegisterResponse;
  } catch (error) {
    logError('Unexpected error in registration handler', { error });
    return errorResponse('An unexpected error occurred during registration') as RegisterResponse;
  }
}

/**
 * Handles user login with fallback mechanisms
 */
export async function handleLogin(req: LoginRequest): Promise<LoginResponse> {
  try {
    const { email, password } = req;
    
    logInfo('Processing login request', { email });
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Direct auth login first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    
    // Handle authentication errors
    if (authError) {
      logWarn('Login failed with direct auth', { error: authError });
      return errorResponse(authError.message || 'Invalid credentials') as LoginResponse;
    }
    
    // If we have a user, verify the password using RPC for extra security
    if (authData.user) {
      const { data: verifyData, error: verifyError } = await supabase.rpc('verify_password', {
        uuid: authData.user.id,
        plain_text: password
      });
      
      if (verifyError || !verifyData) {
        logWarn('Password verification failed', { error: verifyError });
        // Sign out the user since verification failed
        await supabase.auth.signOut();
        return errorResponse('Credential verification failed. Please try again.') as LoginResponse;
      }
      
      // Get dealer profile for the user
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();
      
      if (dealerError) {
        logWarn('Error fetching dealer profile', { error: dealerError });
        // Non-critical error, continue with login
      }
      
      logInfo('Login successful', { userId: authData.user.id });
      
      return successResponse({
        session: authData.session,
        dealer: dealerData || null
      }) as LoginResponse;
    }
    
    return errorResponse('Login failed: Invalid credentials') as LoginResponse;
  } catch (error) {
    logError('Unexpected error in login handler', { error });
    return errorResponse('An unexpected error occurred during login') as LoginResponse;
  }
}

/**
 * Checks if an email exists in the system
 */
export async function handleEmailCheck(req: EmailCheckRequest): Promise<EmailCheckResponse> {
  try {
    const { email } = req;
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Use RPC for email existence check
    const { data, error } = await supabase
      .rpc('check_email_exists', { p_email: normalizedEmail });
    
    if (error) {
      logError('Error checking email existence', { error });
      // Default to not exists on error for security
      return { exists: false };
    }
    
    return { exists: !!data?.exists };
  } catch (error) {
    logError('Unexpected error in email check', { error });
    // Default to not exists on error for security
    return { exists: false };
  }
}
