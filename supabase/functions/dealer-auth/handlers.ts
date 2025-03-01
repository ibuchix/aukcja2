
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database, AuthHandlerResponse, LoginRequest, RegisterRequest } from './types.ts';
import { corsHeaders } from '../_shared/cors.ts';

const validateInput = (email: string, password: string): { isValid: boolean; error?: string } => {
  // Email validation
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  // Password validation for registration
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" };
  }

  return { isValid: true };
};

export function buildErrorResponse(error: string): AuthHandlerResponse {
  console.error(`Error response: ${error}`);
  return {
    success: false,
    error
  };
}

export function buildSuccessResponse(data: Omit<AuthHandlerResponse, 'success'>): AuthHandlerResponse {
  console.log(`Success response: ${JSON.stringify(data)}`);
  return {
    success: true,
    ...data
  };
}

export async function handleRegister(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  request: RegisterRequest
): Promise<AuthHandlerResponse> {
  console.log(`Registration request received for ${request.email}`);
  console.log(`Request details: ${JSON.stringify({
    email: request.email,
    supervisorName: request.supervisorName,
    companyName: request.companyName,
    taxId: request.taxId,
    businessRegistryNumber: request.businessRegistryNumber,
    companyAddress: request.companyAddress
  })}`);

  try {
    const validation = validateInput(request.email, request.password);
    if (!validation.isValid) {
      console.error(`Validation failed: ${validation.error}`);
      return buildErrorResponse(validation.error || 'Invalid input');
    }

    console.log("Calling create_dealer_with_profile RPC function");
    const { data, error } = await supabaseAdmin.rpc('create_dealer_with_profile', {
      p_email: request.email.toLowerCase(),
      p_password: request.password,
      p_supervisor_name: request.supervisorName,
      p_company_name: request.companyName || '',
      p_tax_id: request.taxId || '',
      p_business_registry_number: request.businessRegistryNumber || '',
      p_address: request.companyAddress || ''
    });

    console.log("RPC response:", { data, error });

    if (error) {
      console.error('Registration error:', error);
      return buildErrorResponse(sanitizeError(error));
    }

    if (!data.success) {
      console.error('Registration failed without error:', data);
      return buildErrorResponse('Registration failed');
    }

    console.log('Registration successful, user created:', data.user.id);
    return buildSuccessResponse({
      message: 'Registration successful',
      user: data.user
    });
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    return buildErrorResponse(sanitizeError(error));
  }
}

export async function handleLogin(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  request: LoginRequest
): Promise<AuthHandlerResponse> {
  console.log(`Login attempt for ${request.email}`);
  
  try {
    const validation = validateInput(request.email, request.password);
    if (!validation.isValid) {
      console.error(`Login validation failed: ${validation.error}`);
      return buildErrorResponse(validation.error || 'Invalid input');
    }

    console.log("Attempting signInWithPassword");
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });

    if (signInError) {
      console.error('Login error:', signInError);
      return buildErrorResponse(sanitizeError(signInError));
    }

    if (!signInData?.user) {
      console.error('Invalid login attempt - no user returned');
      return buildErrorResponse('Invalid login attempt');
    }

    console.log(`User authenticated: ${signInData.user.id}`);
    
    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.getSession();

    if (sessionError) {
      console.error('Session validation failed:', sessionError);
      return buildErrorResponse('Session validation failed');
    }

    if (!session || session.user.id !== signInData.user.id) {
      await supabaseAdmin.auth.signOut();
      console.error('Session validation failed - user ID mismatch');
      return buildErrorResponse('Session validation failed');
    }

    console.log("Getting user profile");
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .single();

    if (!profile || profile.role !== 'dealer') {
      await supabaseAdmin.auth.signOut();
      console.error('Invalid account type');
      return buildErrorResponse('Invalid account type');
    }

    console.log("Getting dealer profile");
    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('id, dealership_name, verification_status, is_verified')
      .eq('user_id', signInData.user.id)
      .single();

    if (dealerError) {
      console.error('Error fetching dealer profile:', dealerError);
      return buildErrorResponse(sanitizeError(dealerError));
    }

    if (!dealer) {
      console.error('Dealer profile not found');
      return buildErrorResponse('Dealer profile not found');
    }

    if (dealer.verification_status === 'rejected') {
      console.error('Application rejected');
      return buildErrorResponse('Your dealer application has been rejected. Please contact support.');
    }

    console.log('Login successful');
    return buildSuccessResponse({
      message: 'Login successful',
      session: session,
      dealer: dealer,
      requiresVerification: dealer.verification_status === 'pending'
    });
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return buildErrorResponse(sanitizeError(error));
  }
}

const sanitizeError = (error: any): string => {
  console.error('Original error:', error);

  if (typeof error === 'object' && error !== null) {
    if (error.code === '23505') {
      if (error.message?.toLowerCase().includes('email')) {
        return 'An account with this email already exists';
      }
      if (error.message?.toLowerCase().includes('business_registry_number')) {
        return 'This business registry number is already registered';
      }
      if (error.message?.toLowerCase().includes('tax_id')) {
        return 'This tax ID is already registered';
      }
      return 'A duplicate registration was detected';
    }

    if (error.message?.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
  }

  return 'An unexpected error occurred. Please try again later';
};
