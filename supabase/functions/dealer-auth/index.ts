
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    const { action, email, password, supervisorName, phoneNumber, companyName, taxId, businessRegistryNumber, companyAddress } = await req.json() as AuthRequest

    console.log(`Processing ${action} request for email: ${email}`)

    if (action === 'register') {
      // Start a transaction for the registration process
      const { data: { user }, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: supervisorName,
          role: 'dealer'
        }
      })

      if (signUpError) {
        console.error('Error creating auth user:', signUpError)
        throw signUpError
      }

      if (!user?.id) {
        throw new Error('No user ID returned from auth signup')
      }

      console.log('Auth user created successfully:', user.id)

      // Insert dealer profile
      const { error: dealerError } = await supabaseClient
        .from('dealers')
        .insert({
          user_id: user.id,
          supervisor_name: supervisorName,
          dealership_name: companyName,
          tax_id: taxId,
          business_registry_number: businessRegistryNumber,
          address: companyAddress,
          verification_status: 'pending',
          is_verified: false,
          license_number: businessRegistryNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (dealerError) {
        // If dealer creation fails, clean up the auth user
        await supabaseClient.auth.admin.deleteUser(user.id)
        console.error('Error creating dealer profile:', dealerError)
        throw dealerError
      }

      console.log('Dealer profile created successfully')

      // Create basic profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          role: 'dealer',
          full_name: supervisorName
        })

      if (profileError) {
        // If profile creation fails, clean up everything
        await supabaseClient.auth.admin.deleteUser(user.id)
        console.error('Error creating user profile:', profileError)
        throw profileError
      }

      console.log('Profile created successfully')

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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      // Get dealer profile
      const { data: dealer, error: dealerError } = await supabaseClient
        .from('dealers')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (dealerError) {
        console.error('Error fetching dealer profile:', dealerError)
        throw dealerError
      }

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
    console.error('Error processing request:', err)
    
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
