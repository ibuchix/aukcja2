
import { createEdgeClient, createServiceClient } from '@shared/supabase-client.ts';
import { corsHeaders } from '@shared/cors.ts';
import { verifyDependencies } from '@shared/dependencies.ts';

// Initialize early with dependency verification
verifyDependencies();
const adminClient = createServiceClient();

// Modified to accept parsed body and headers instead of raw request
export async function handleRegister(body: any, headers: Headers) {
  try {
    // Validate required fields
    const requiredFields = ['email', 'password', 'supervisorName', 'companyName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse({
          message: `Missing required field: ${field}`,
          code: 'missing_field',
          status: 400
        });
      }
    }
    
    // Create client using just the headers
    const supabaseClient = createEdgeClient(headers);

    // Check if user already exists to provide better error messages
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return createErrorResponse({
        message: 'User with this email already exists',
        code: 'user_exists',
        status: 409
      });
    }

    // Use RPC function for atomic registration
    const { data, error } = await adminClient.rpc('create_dealer_with_profile', {
      p_email: body.email.toLowerCase(),
      p_password: body.password,
      p_supervisor_name: body.supervisorName,
      p_company_name: body.companyName,
      p_tax_id: body.taxId || '',
      p_business_registry_number: body.businessRegistryNumber || '',
      p_address: body.companyAddress || ''
    });

    if (error) {
      // Handle specific error codes
      if (error.message?.includes('already exists')) {
        return createErrorResponse({
          message: 'User with this email already exists',
          code: 'user_exists',
          status: 409
        });
      }
      
      return createErrorResponse({
        message: error.message,
        code: error.code,
        status: 400
      });
    }

    // Send verification email if registration successful
    if (data?.success) {
      const { error: signInError } = await supabaseClient.auth.signInWithOtp({
        email: body.email.toLowerCase(),
        options: {
          // Use a simpler approach to get origin for redirect
          emailRedirectTo: body.redirectUrl || 'http://localhost:3000/auth?verify=true'
        }
      });

      if (signInError) {
        console.error('Error sending verification email:', signInError);
      }
    }

    return createResponse({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      userId: data?.user?.id
    }, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Updated to accept parsed body and headers
export async function handleLogin(body: any, headers: Headers) {
  try {
    // Validate required fields
    if (!body.email || !body.password) {
      return createErrorResponse({
        message: !body.email ? 'Email is required' : 'Password is required',
        code: 'missing_credentials',
        status: 400
      });
    }
    
    const supabaseClient = createEdgeClient(headers);
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: body.email.toLowerCase(),
      password: body.password,
    });

    if (error) {
      console.error('Login error:', error);
      return createErrorResponse({
        message: 'Invalid login credentials',
        code: 'invalid_credentials',
        status: 401
      });
    }

    // Fetch dealer profile
    const { data: dealer, error: dealerError } = await adminClient
      .from('dealers')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (dealerError && dealerError.code !== 'PGRST116') {
      console.error('Error fetching dealer profile:', dealerError);
    }

    return createResponse({
      success: true,
      session: data.session,
      dealer: dealer || null
    });
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return createErrorResponse(error);
  }
}

// Helper to create standardized responses
function createResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

function createErrorResponse(error: { message: string, code?: string, status?: number }) {
  console.error(`Error: ${error.message}`, error);
  return createResponse({ 
    success: false, 
    error: error.message,
    code: error.code || 'unknown_error'
  }, error.status || 400);
}

// Updated to accept parsed body instead of raw request
export async function handleVerifyPassword(body: any, headers: Headers) {
  try {
    if (!body.userId || !body.password) {
      return createErrorResponse({
        message: !body.userId ? 'User ID is required' : 'Password is required',
        code: 'missing_field',
        status: 400
      });
    }
    
    const { data, error } = await adminClient.rpc('verify_password', {
      uuid: body.userId,
      plain_text: body.password
    });

    if (error) {
      return createErrorResponse({
        message: 'Password verification failed',
        code: 'verification_failed',
        status: 400
      });
    }

    return createResponse({
      success: true,
      verified: data
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Helper function to create Supabase client from headers only
function createEdgeClientFromHeaders(headers: Headers) {
  // Implementation details would go here if needed
  return createEdgeClient(headers);
}
