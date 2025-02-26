
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { AuthRequest } from './types.ts'
import { createErrorResponse, createSuccessResponse, sanitizeError } from './response-utils.ts'

export async function handleRegistration(
  supabaseClient: SupabaseClient,
  requestData: AuthRequest
) {
  if (!requestData.supervisorName) {
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
    return createErrorResponse(sanitizeError(error))
  }

  if (!data.success) {
    return createErrorResponse('Registration failed')
  }

  return createSuccessResponse({
    message: 'Registration successful',
    user: data.user
  })
}

export async function handleLogin(
  supabaseClient: SupabaseClient,
  requestData: AuthRequest
) {
  console.log('Starting login process for:', requestData.email)
  
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: requestData.email,
    password: requestData.password,
  })

  if (signInError) {
    return createErrorResponse(sanitizeError(signInError))
  }

  if (!signInData?.user) {
    return createErrorResponse('Invalid login attempt')
  }

  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

  if (sessionError) {
    return createErrorResponse('Session validation failed')
  }

  if (!session || session.user.id !== signInData.user.id) {
    await supabaseClient.auth.signOut()
    return createErrorResponse('Session validation failed')
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .single();

  if (!profile || profile.role !== 'dealer') {
    await supabaseClient.auth.signOut()
    return createErrorResponse('Invalid account type')
  }

  const { data: dealer, error: dealerError } = await supabaseClient
    .from('dealers')
    .select('id, dealership_name, verification_status, is_verified')
    .eq('user_id', signInData.user.id)
    .single()

  if (dealerError) {
    return createErrorResponse(sanitizeError(dealerError))
  }

  if (!dealer) {
    return createErrorResponse('Dealer profile not found')
  }

  if (dealer.verification_status === 'rejected') {
    return createErrorResponse('Your dealer application has been rejected. Please contact support.')
  }

  return createSuccessResponse({
    message: 'Login successful',
    session: session,
    dealer: dealer,
    requiresVerification: dealer.verification_status === 'pending'
  })
}
