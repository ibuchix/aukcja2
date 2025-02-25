
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

const createSuccessResponse = (data: any) => {
  // Sanitize sensitive data before sending response
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
      throw new Error('Missing required environment variables');
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
        console.error('Registration failed:', error);
        return createErrorResponse(error.message)
      }

      if (!data.success) {
        return createErrorResponse(data.error || 'Registration failed')
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
        throw signInError
      }

      if (!data.user) {
        throw new Error('No user data returned from login')
      }

      const { data: dealer, error: dealerError } = await supabaseClient
        .from('dealers')
        .select('id, dealership_name, verification_status, is_verified')
        .eq('user_id', data.user.id)
        .single()

      if (dealerError) {
        throw dealerError
      }

      if (!dealer) {
        throw new Error('Dealer profile not found')
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
      error: err,
      errorMessage: err.message,
      timestamp: new Date().toISOString()
    })
    
    return createErrorResponse(err.message || 'An unexpected error occurred')
  }
})
