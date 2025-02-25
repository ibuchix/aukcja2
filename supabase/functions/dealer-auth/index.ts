
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

    console.log('Processing request:', {
      action,
      email,
      timestamp: new Date().toISOString(),
      hasPassword: !!requestData.password,
      metadata: {
        hasSupervisorName: !!requestData.supervisorName,
        hasCompanyName: !!requestData.companyName,
        hasPhoneNumber: !!requestData.phoneNumber,
        hasTaxId: !!requestData.taxId,
        hasBusinessRegistry: !!requestData.businessRegistryNumber,
        hasAddress: !!requestData.companyAddress
      }
    })

    if (action === 'register') {
      console.log('Starting registration process for:', email)
      
      // 1. Create auth user
      console.log('Step 1: Creating auth user')
      const { data: { user }, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email,
        password: requestData.password,
        email_confirm: true,
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
        console.error('No user ID returned from auth signup')
        throw new Error('No user ID returned from auth signup')
      }

      console.log('Auth user created successfully:', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      })

      // 2. Create dealer profile
      console.log('Step 2: Creating dealer profile')
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
          license_number: requestData.businessRegistryNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (dealerError) {
        console.error('Dealer profile creation failed:', {
          error: dealerError,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        
        // Cleanup: Delete auth user
        console.log('Rolling back: Deleting auth user due to dealer profile creation failure')
        await supabaseClient.auth.admin.deleteUser(user.id)
        
        throw dealerError
      }

      console.log('Dealer profile created successfully:', {
        userId: user.id,
        timestamp: new Date().toISOString()
      })

      // 3. Create basic profile
      console.log('Step 3: Creating user profile')
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          role: 'dealer',
          full_name: requestData.supervisorName
        })

      if (profileError) {
        console.error('Profile creation failed:', {
          error: profileError,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        
        // Cleanup: Delete auth user
        console.log('Rolling back: Deleting auth user due to profile creation failure')
        await supabaseClient.auth.admin.deleteUser(user.id)
        
        throw profileError
      }

      console.log('Registration completed successfully:', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({
          success: true,
          user: user,
          message: 'Registration successful'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

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
