
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AuthRequest {
  action: 'register' | 'login'
  email: string
  password: string
  supervisorName?: string
  phoneNumber?: string
  companyName?: string
  taxId?: string 
  businessRegistryNumber?: string
  companyAddress?: string
}

const createErrorResponse = (message: string, status = 400) => {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  )
}

const sanitizeError = (error: any): string => {
  // Log the full error for debugging while returning safe message to user
  console.error('Original error:', error);

  if (typeof error === 'object' && error !== null) {
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
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

    // Handle authentication errors
    if (error.message?.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
  }

  // Default safe error messages
  return 'An unexpected error occurred. Please try again later';
}

const createSuccessResponse = (data: any) => {
  const sanitizedData = {
    success: true,
    message: data.message,
    ...data.user && {
      user: {
        id: data.user.id,
        email: data.user.email
      }
    },
    ...data.dealer && {
      dealer: {
        id: data.dealer.id,
        dealership_name: data.dealer.dealership_name,
        verification_status: data.dealer.verification_status,
        is_verified: data.dealer.is_verified
      }
    },
    ...data.session && {
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at
      }
    }
  }

  return new Response(
    JSON.stringify(sanitizedData),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Request received:', new Date().toISOString())
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('Service configuration error');
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestData = await req.json() as AuthRequest
    const { action, email } = requestData

    if (!email || !requestData.password) {
      return createErrorResponse('Email and password are required')
    }

    if (action === 'register') {
      if (!requestData.supervisorName) {
        return createErrorResponse('Supervisor name is required for registration')
      }

      const { data, error } = await supabaseClient.rpc('create_dealer_with_profile', {
        p_email: email.toLowerCase(),
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

    } else if (action === 'login') {
      console.log('Starting login process for:', email)
      
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: requestData.email,
        password: requestData.password,
      })

      if (signInError) {
        return createErrorResponse(sanitizeError(signInError))
      }

      if (!data.user) {
        return createErrorResponse('Invalid login attempt')
      }

      const { data: dealer, error: dealerError } = await supabaseClient
        .from('dealers')
        .select('id, dealership_name, verification_status, is_verified')
        .eq('user_id', data.user.id)
        .single()

      if (dealerError) {
        return createErrorResponse(sanitizeError(dealerError))
      }

      if (!dealer) {
        return createErrorResponse('Dealer profile not found')
      }

      return createSuccessResponse({
        message: 'Login successful',
        session: data.session,
        dealer: dealer
      })
    }

    return createErrorResponse('Invalid action')

  } catch (err) {
    console.error('Request failed:', {
      timestamp: new Date().toISOString(),
      errorType: err.constructor.name,
      errorMessage: err.message
    })
    
    return createErrorResponse(sanitizeError(err))
  }
})
