
import { createEdgeClient, createResponse, createErrorResponse, validateRequiredFields } from '@shared/dependencies.ts';
import { createServiceClient } from '@shared/supabase-client.ts';
import { corsHeaders } from '@shared/cors.ts';

export async function handleRegister(req: Request) {
  try {
    const body = await req.json();
    validateRequiredFields(body, ['email', 'password', 'supervisorName', 'companyName']);
    
    const supabaseClient = createEdgeClient(req);
    const adminClient = createServiceClient();

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
          emailRedirectTo: new URL(req.url).origin + '/auth?verify=true'
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

export async function handleLogin(req: Request) {
  try {
    const body = await req.json();
    validateRequiredFields(body, ['email', 'password']);
    
    const supabaseClient = createEdgeClient(req);
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: body.email.toLowerCase(),
      password: body.password,
    });

    if (error) {
      return createErrorResponse({
        message: 'Invalid login credentials',
        code: 'invalid_credentials',
        status: 401
      });
    }

    // Fetch dealer profile
    const { data: dealer, error: dealerError } = await supabaseClient
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
    return createErrorResponse(error);
  }
}

// Handle password verification (used for additional security checks)
export async function handleVerifyPassword(req: Request) {
  try {
    const body = await req.json();
    validateRequiredFields(body, ['userId', 'password']);
    
    const adminClient = createServiceClient();
    
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

// Update index file to use these handlers
