
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
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
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
    
    // Log credentials for verification (without showing full key)
    console.log("Supabase URL:", supabaseUrl)
    console.log("Supabase Key length:", supabaseKey.length)
    
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

      // More efficient user existence check
      console.log('Checking if user exists:', email)
      const { data: { user: existingUser }, error: fetchError } = 
        await supabaseClient.auth.admin.getUserByIdentifier(email)

      if (fetchError?.status !== 404) { // Handle non-404 errors
        console.error('Error checking user existence:', fetchError)
        throw fetchError
      }

      if (existingUser) {
        console.log('User already exists:', email)
        return createErrorResponse("An account with this email already exists", 409)
      }

      console.log('Creating new user with email:', email)
      
      // Begin transaction-like operations
      let user;
      try {
        // Step 1: Create auth user
        const { data: { user: newUser }, error: signUpError } = await supabaseClient.auth.admin.createUser({
          email,
          password: requestData.password,
          email_confirm: true, // Auto-confirm email for better testing
          user_metadata: {
            name: requestData.supervisorName
          }
        })

        if (signUpError || !newUser) {
          throw signUpError || new Error('Failed to create user')
        }

        user = newUser
        console.log('Auth user created successfully:', { userId: user.id })

        // Step 2: Create dealer profile
        const { error: dealerError } = await supabaseClient
          .from('dealers')
          .insert({
            user_id: user.id,
            supervisor_name: requestData.supervisorName,
            dealership_name: requestData.companyName,
            tax_id: requestData.taxId,
            business_registry_number: requestData.businessRegistryNumber,
            address: requestData.companyAddress,
            verification_status: 'pending',
            is_verified: false,
            license_number: requestData.businessRegistryNumber || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (dealerError) {
          throw dealerError
        }

        console.log('Dealer profile created successfully')

        // Step 3: Create basic profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: user.id,
            role: 'dealer',
            full_name: requestData.supervisorName,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          throw profileError
        }

        console.log('Basic profile created successfully')

        return createSuccessResponse({
          user,
          message: 'Registration successful'
        })

      } catch (error) {
        console.error('Registration process failed:', {
          error,
          email,
          timestamp: new Date().toISOString()
        })
        
        // Clean up if user was created but subsequent steps failed
        if (user?.id) {
          try {
            await supabaseClient.auth.admin.deleteUser(user.id)
            console.log('Cleaned up failed registration for user:', user.id)
          } catch (cleanupError) {
            console.error('Failed to cleanup user after failed registration:', cleanupError)
          }
        }
        
        throw error
      }
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

      console.log('User authenticated successfully:', {
        userId: data.user.id,
        timestamp: new Date().toISOString()
      })

      // Fetch dealer profile
      const { data: dealer, error: dealerError } = await supabaseClient
        .from('dealers')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (dealerError) {
        throw dealerError
      }

      if (!dealer) {
        throw new Error('Dealer profile not found')
      }

      return createSuccessResponse({
        session: data.session,
        dealer: dealer,
        message: 'Login successful'
      })
    }

    return createErrorResponse('Invalid action')

  } catch (err) {
    console.error('Request failed:', {
      error: err,
      errorMessage: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    })
    
    return createErrorResponse(err.message || 'An unexpected error occurred')
  }
})
