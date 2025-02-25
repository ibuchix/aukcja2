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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Request received:', new Date().toISOString())
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestData = await req.json() as AuthRequest
    const { action, email } = requestData

    if (action === 'register') {
      // First check if user already exists
      const { data: existingUser } = await supabaseClient.auth.admin.getUserByEmail(email)
      
      if (existingUser) {
        console.log('User already exists:', email)
        return new Response(
          JSON.stringify({
            success: false,
            error: "An account with this email already exists"
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      console.log('Creating new user with email:', email)
      
      try {
        const { data: { user }, error: signUpError } = await supabaseClient.auth.admin.createUser({
          email,
          password: requestData.password,
          email_confirm: false, // Changed to false to ensure email verification
          user_metadata: {
            name: requestData.supervisorName,
            role: 'dealer'
          }
        })

        if (signUpError) {
          console.error('Auth user creation failed:', {
            error: signUpError,
            email,
            timestamp: new Date().toISOString()
          })
          throw signUpError
        }

        if (!user?.id) {
          throw new Error('No user ID returned from auth signup')
        }

        console.log('Auth user created successfully:', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        })

        // Create dealer profile
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
          console.error('Dealer profile creation failed:', {
            error: dealerError,
            userId: user.id,
            timestamp: new Date().toISOString()
          })
          await supabaseClient.auth.admin.deleteUser(user.id)
          throw dealerError
        }

        // Create basic profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: user.id,
            role: 'dealer',
            full_name: requestData.supervisorName,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation failed:', {
            error: profileError,
            userId: user.id,
            timestamp: new Date().toISOString()
          })
          await supabaseClient.auth.admin.deleteUser(user.id)
          throw profileError
        }

        // Send email confirmation
        const { error: emailError } = await supabaseClient.auth.admin.generateLink({
          type: 'signup',
          email: email,
        })

        if (emailError) {
          console.error('Error sending verification email:', emailError)
          // Don't throw here, just log the error
        }

        return new Response(
          JSON.stringify({
            success: true,
            user: user,
            message: 'Registration successful, please check your email for verification'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      } catch (error) {
        console.error('Registration process failed:', {
          error,
          email,
          timestamp: new Date().toISOString(),
          stack: error.stack
        })
        
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message || 'Registration failed'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
    } else if (action === 'login') {
      console.log('Starting login process for:', email)
      
      // 1. Authenticate user
      console.log('Step 1: Authenticating user')
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: requestData.email,
        password: requestData.password,
      })

      if (error) {
        console.error('Login authentication failed:', {
          error,
          email,
          timestamp: new Date().toISOString()
        })
        throw error
      }

      console.log('User authenticated successfully:', {
        userId: data.user.id,
        timestamp: new Date().toISOString()
      })

      // 2. Fetch dealer profile
      console.log('Step 2: Fetching dealer profile')
      const { data: dealer, error: dealerError } = await supabaseClient
        .from('dealers')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (dealerError) {
        console.error('Error fetching dealer profile:', {
          error: dealerError,
          userId: data.user.id,
          timestamp: new Date().toISOString()
        })
        throw dealerError
      }

      console.log('Login completed successfully:', {
        userId: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({
          success: true,
          session: data.session,
          dealer: dealer,
          message: 'Login successful'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')

  } catch (err) {
    console.error('Request failed:', {
      error: err,
      errorMessage: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
