
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { AuthRequest } from './types.ts'
import { createErrorResponse, createSuccessResponse, sanitizeError } from './response-utils.ts'
import { logAuthEvent } from './logging.ts'

export async function handleRegistration(
  supabaseClient: SupabaseClient,
  requestData: AuthRequest,
  req: Request
) {
  if (!requestData.supervisorName) {
    logAuthEvent(req, 'register', requestData.email, 'failure', 'Missing supervisor name')
    return createErrorResponse('Supervisor name is required for registration')
  }

  const { data, error } = await supabaseClient.rpc('create_dealer_with_profile', {
    p_email: requestData.email.toLowerCase(),
    p_password: requestData.password,
    p_supervisor_name: requestData.supervisorName,
    p_company_name: requestData.companyName || '',
    p_tax_id: requestData.taxId || '',
    p_business_registry_number: requestData.businessRegistryNumber || '',
    p_address: requestData.companyAddress || ''
  });

  if (error) {
    const errorMessage = sanitizeError(error)
    logAuthEvent(req, 'register', requestData.email, 'failure', errorMessage)
    return createErrorResponse(errorMessage)
  }

  if (!data.success) {
    logAuthEvent(req, 'register', requestData.email, 'failure', 'Registration failed')
    return createErrorResponse('Registration failed')
  }

  logAuthEvent(req, 'register', requestData.email, 'success')
  return createSuccessResponse({
    message: 'Registration successful',
    user: data.user
  })
}

export async function handleLogin(
  supabaseClient: SupabaseClient,
  requestData: AuthRequest,
  req: Request
) {
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: requestData.email,
    password: requestData.password,
  })

  if (signInError) {
    const errorMessage = sanitizeError(signInError)
    logAuthEvent(req, 'login', requestData.email, 'failure', errorMessage)
    return createErrorResponse(errorMessage)
  }

  if (!signInData?.user) {
    logAuthEvent(req, 'login', requestData.email, 'failure', 'Invalid login attempt')
    return createErrorResponse('Invalid login attempt')
  }

  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

  if (sessionError) {
    logAuthEvent(req, 'login', requestData.email, 'failure', 'Session validation failed')
    return createErrorResponse('Session validation failed')
  }

  if (!session || session.user.id !== signInData.user.id) {
    await supabaseClient.auth.signOut()
    logAuthEvent(req, 'login', requestData.email, 'failure', 'Session validation failed')
    return createErrorResponse('Session validation failed')
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .single();

  if (!profile || profile.role !== 'dealer') {
    await supabaseClient.auth.signOut()
    logAuthEvent(req, 'login', requestData.email, 'failure', 'Invalid account type')
    return createErrorResponse('Invalid account type')
  }

  const { data: dealer, error: dealerError } = await supabaseClient
    .from('dealers')
    .select('id, dealership_name, verification_status, is_verified')
    .eq('user_id', signInData.user.id)
    .single()

  if (dealerError) {
    const errorMessage = sanitizeError(dealerError)
    logAuthEvent(req, 'login', requestData.email, 'failure', errorMessage)
    return createErrorResponse(errorMessage)
  }

  if (!dealer) {
    logAuthEvent(req, 'login', requestData.email, 'failure', 'Dealer profile not found')
    return createErrorResponse('Dealer profile not found')
  }

  if (dealer.verification_status === 'rejected') {
    logAuthEvent(req, 'login', requestData.email, 'failure', 'Application rejected')
    return createErrorResponse('Your dealer application has been rejected. Please contact support.')
  }

  logAuthEvent(req, 'login', requestData.email, 'success')
  return createSuccessResponse({
    message: 'Login successful',
    session: session,
    dealer: dealer,
    requiresVerification: dealer.verification_status === 'pending'
  })
}
