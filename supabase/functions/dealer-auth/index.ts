import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Rate limiter implementation
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private tokensPerInterval: number;
  private interval: number;

  constructor({ tokensPerInterval, interval }: { tokensPerInterval: number, interval: string }) {
    this.tokens = tokensPerInterval;
    this.lastRefill = Date.now();
    this.tokensPerInterval = tokensPerInterval;
    this.interval = interval === 'minute' ? 60000 : 3600000; // Convert to milliseconds
  }

  async check(request: Request): Promise<boolean> {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed > this.interval) {
      this.tokens = this.tokensPerInterval;
      this.lastRefill = now;
    } else {
      const tokensToAdd = Math.floor(timePassed * (this.tokensPerInterval / this.interval));
      this.tokens = Math.min(this.tokensPerInterval, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }
}

// Initialize rate limiter
const limiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "minute"
});

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
    
    // Rate limiting check
    if (!await limiter.check(req)) {
      return new Response("Too many requests", {
        status: 429,
        headers: corsHeaders
      });
    }
    
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
      
      // Initial sign in
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

      // Validate session freshness
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

      if (sessionError) {
        return createErrorResponse('Session validation failed')
      }

      if (!session || session.user.id !== signInData.user.id) {
        await supabaseClient.auth.signOut()
        return createErrorResponse('Session validation failed')
      }

      // Check profile role and verification status
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single();

      if (!profile || profile.role !== 'dealer') {
        await supabaseClient.auth.signOut()
        return createErrorResponse('Invalid account type')
      }

      // Get dealer profile and verify status
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

      // Check if dealer registration is complete and verified
      if (dealer.verification_status === 'rejected') {
        return createErrorResponse('Your dealer application has been rejected. Please contact support.')
      }

      // Allow login but include verification status in response
      // This lets the frontend show appropriate messages for pending verification
      return createSuccessResponse({
        message: 'Login successful',
        session: session,
        dealer: dealer,
        requiresVerification: dealer.verification_status === 'pending'
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
