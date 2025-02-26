import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';
import { cors } from '../_shared/cors';
import { AuthHandlerResponse, LoginRequest, RegisterRequest } from './types';
import { buildErrorResponse, buildSuccessResponse } from './response-utils';
import { logError, logInfo } from './logging';

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

export async function handleRegister(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  request: RegisterRequest
): Promise<AuthHandlerResponse> {
  try {
    const validation = validateInput(request.email, request.password);
    if (!validation.isValid) {
      return buildErrorResponse(validation.error || 'Invalid input');
    }

    const { data, error } = await supabaseAdmin.rpc('create_dealer_with_profile', {
      p_email: request.email.toLowerCase(),
      p_password: request.password,
      p_supervisor_name: request.supervisorName,
      p_company_name: request.companyName || '',
      p_tax_id: request.taxId || '',
      p_business_registry_number: request.businessRegistryNumber || '',
      p_address: request.companyAddress || ''
    });

    if (error) {
      const errorMessage = sanitizeError(error)
      logError('register', request.email, errorMessage)
      return buildErrorResponse(errorMessage)
    }

    if (!data.success) {
      logError('register', request.email, 'Registration failed')
      return buildErrorResponse('Registration failed')
    }

    logInfo('register', request.email, 'success')
    return buildSuccessResponse({
      message: 'Registration successful',
      user: data.user
    })
  } catch (error) {
    logError('register', request.email, sanitizeError(error))
    return buildErrorResponse(sanitizeError(error))
  }
}

export async function handleLogin(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  request: LoginRequest
): Promise<AuthHandlerResponse> {
  try {
    const validation = validateInput(request.email, request.password);
    if (!validation.isValid) {
      return buildErrorResponse(validation.error || 'Invalid input');
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    })

    if (signInError) {
      const errorMessage = sanitizeError(signInError)
      logError('login', request.email, errorMessage)
      return buildErrorResponse(errorMessage)
    }

    if (!signInData?.user) {
      logError('login', request.email, 'Invalid login attempt')
      return buildErrorResponse('Invalid login attempt')
    }

    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.getSession()

    if (sessionError) {
      logError('login', request.email, 'Session validation failed')
      return buildErrorResponse('Session validation failed')
    }

    if (!session || session.user.id !== signInData.user.id) {
      await supabaseAdmin.auth.signOut()
      logError('login', request.email, 'Session validation failed')
      return buildErrorResponse('Session validation failed')
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .single();

    if (!profile || profile.role !== 'dealer') {
      await supabaseAdmin.auth.signOut()
      logError('login', request.email, 'Invalid account type')
      return buildErrorResponse('Invalid account type')
    }

    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('id, dealership_name, verification_status, is_verified')
      .eq('user_id', signInData.user.id)
      .single()

    if (dealerError) {
      const errorMessage = sanitizeError(dealerError)
      logError('login', request.email, errorMessage)
      return buildErrorResponse(errorMessage)
    }

    if (!dealer) {
      logError('login', request.email, 'Dealer profile not found')
      return buildErrorResponse('Dealer profile not found')
    }

    if (dealer.verification_status === 'rejected') {
      logError('login', request.email, 'Application rejected')
      return buildErrorResponse('Your dealer application has been rejected. Please contact support.')
    }

    logInfo('login', request.email, 'success')
    return buildSuccessResponse({
      message: 'Login successful',
      session: session,
      dealer: dealer,
      requiresVerification: dealer.verification_status === 'pending'
    })
  } catch (error) {
    logError('login', request.email, sanitizeError(error))
    return buildErrorResponse(sanitizeError(error))
  }
}
