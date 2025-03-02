
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateEmailFormat, validatePasswordStrength } from './validation.ts'
import { createErrorResponse, createSuccessResponse } from './response-utils.ts'
import { log, logError } from './logging.ts'

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Create a client with the service role key for admin operations
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create a regular client for operations that should respect RLS
const regularClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function handleRegister(req: Request): Promise<Response> {
  try {
    const { email, password, metadata } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    // Validate email format
    if (!validateEmailFormat(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return createErrorResponse(passwordValidation.message, 400)
    }

    // Check if user already exists
    try {
      // First attempt with auth API
      const { data: existingUser, error: userError } = await adminClient.auth.admin.getUserByEmail(email)
      
      if (userError) {
        log(`Error checking user with auth API: ${userError.message}`)
        // Fall back to direct DB query
        const { data: users, error: queryError } = await adminClient
          .from('auth.users')
          .select('id, email')
          .eq('email', email)
          .limit(1)
        
        if (queryError) {
          logError('Error checking for existing user', queryError)
          // Third fallback to a simpler query
          const { data, error: fallbackError } = await adminClient.rpc('check_email_exists', {
            email_to_check: email
          })
          
          if (fallbackError) {
            logError('All methods to check user existence failed', fallbackError)
            return createErrorResponse('Error checking user existence', 500)
          }
          
          if (data && data.exists) {
            return createErrorResponse('User with this email already exists', 409)
          }
        } else if (users && users.length > 0) {
          return createErrorResponse('User with this email already exists', 409)
        }
      } else if (existingUser) {
        return createErrorResponse('User with this email already exists', 409)
      }
    } catch (err) {
      logError('Exception checking user existence', err)
      return createErrorResponse('Error checking user existence', 500)
    }

    // Create the user with profile using the database function
    const { data, error } = await adminClient.rpc('create_dealer_with_profile', {
      p_email: email,
      p_password: password,
      p_supervisor_name: metadata?.name || '',
      p_company_name: metadata?.companyName || '',
      p_tax_id: metadata?.taxId || '',
      p_business_registry_number: metadata?.businessRegistryNumber || '',
      p_address: metadata?.companyAddress || ''
    })

    if (error) {
      logError('Error creating dealer with profile', error)
      return createErrorResponse(`Registration failed: ${error.message}`, 500)
    }

    if (!data.success) {
      logError('create_dealer_with_profile returned failure', data)
      return createErrorResponse(data.error || 'User creation failed', 500)
    }

    // Registration successful
    log(`Successfully registered user with email: ${email}`)
    return createSuccessResponse({
      message: 'Registration successful',
      user: data.user
    })
  } catch (err) {
    logError('Unexpected error in handleRegister', err)
    return createErrorResponse('Unexpected error during registration', 500)
  }
}

export async function handleLogin(req: Request): Promise<Response> {
  try {
    const { email, password } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    // Attempt to sign in
    const { data, error } = await regularClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return createErrorResponse(`Login failed: ${error.message}`, 401)
    }

    return createSuccessResponse({
      message: 'Login successful',
      session: data.session,
      user: data.user
    })
  } catch (err) {
    logError('Unexpected error in handleLogin', err)
    return createErrorResponse('Unexpected error during login', 500)
  }
}
