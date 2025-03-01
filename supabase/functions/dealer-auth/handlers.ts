import { 
  createResponse, 
  errorResponse, 
  successResponse,
  createErrorResponse,
  createSuccessResponse,
  sanitizeError
} from './response-utils.ts';
import { supabase } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { 
  UserResponse, 
  AuthPayload, 
  LoginPayload, 
  RegistrationPayload, 
  CheckEmailPayload 
} from './types.ts';

export const handleRegistration = async (req: Request) => {
  try {
    const payload = await req.json() as RegistrationPayload;

    // Validate required fields
    if (!payload.email || !payload.password || !payload.supervisorName) {
      return errorResponse('Email, password, and supervisor name are required', 400);
    }

    // Check if email already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', payload.email)
      .maybeSingle();

    if (existingUserError) {
      console.error('Email check error:', existingUserError);
      return errorResponse('Failed to check email existence', 500);
    }

    if (existingUser) {
      return errorResponse('Email already in use', 409);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.supervisorName,
          company_name: payload.companyName,
          phone_number: payload.phoneNumber,
          tax_id: payload.taxId,
          business_registry_number: payload.businessRegistryNumber,
          company_address: payload.companyAddress,
          role: 'dealer'
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return errorResponse(authError.message, 400);
    }

    if (!authData.user) {
      return errorResponse('Failed to create user', 500);
    }

    // Create dealer profile in public.dealers
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .insert([
        {
          user_id: authData.user.id,
          supervisor_name: payload.supervisorName,
          dealership_name: payload.companyName,
          tax_id: payload.taxId,
          business_registry_number: payload.businessRegistryNumber,
          address: payload.companyAddress,
          verification_status: 'pending',
          is_verified: false,
          license_number: payload.businessRegistryNumber
        }
      ]);

    if (dealerError) {
      console.error('Dealer profile creation error:', dealerError);

      // Attempt to delete the user if dealer creation fails
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
      if (deleteError) {
        console.error('Failed to delete user after dealer creation failure:', deleteError);
      }

      return errorResponse('Failed to create dealer profile', 500);
    }

    // Create profile in public.profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: payload.email,
          full_name: payload.supervisorName,
          role: 'dealer',
          updated_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);

      // Attempt to delete the user if profile creation fails
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
      if (deleteError) {
        console.error('Failed to delete user after profile creation failure:', deleteError);
      }

      return errorResponse('Failed to create profile', 500);
    }

    return successResponse({
      user: { id: authData.user.id, email: authData.user.email }
    });
    
  } catch (error) {
    return errorResponse(error.message, 500, {
      errorCode: 'REGISTRATION_FAILED'
    });
  }
};

export const handleLogin = async (req: Request) => {
  try {
    const payload = await req.json() as LoginPayload;
    
    // Validate required fields
    if (!payload.email || !payload.password) {
      return errorResponse('Email and password are required', 400);
    }
    
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    
    if (error) {
      console.error('Login error:', error);
      return errorResponse(error.message, 401);
    }
    
    if (!data.user || !data.session) {
      return errorResponse('Failed to authenticate user', 401);
    }
    
    // Return success with user data
    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Unexpected login error:', error);
    return errorResponse('Authentication failed', 500);
  }
};

export const handleEmailCheck = async (req: Request) => {
  try {
    const payload = await req.json() as CheckEmailPayload;
    
    if (!payload.email) {
      return errorResponse('Email is required', 400);
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', payload.email)
      .maybeSingle();
    
    if (error) {
      console.error('Email check error:', error);
      return errorResponse('Failed to check email', 500);
    }
    
    return successResponse({
      exists: !!data,
      email: payload.email
    });
  } catch (error) {
    console.error('Unexpected email check error:', error);
    return errorResponse('Failed to check email', 500);
  }
};

export const handleAuth = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Missing or invalid Authorization header', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Error getting user:', error);
      return createErrorResponse('Invalid token', 401);
    }

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    });

  } catch (error) {
    const errorMessage = sanitizeError(error);
    console.error('Unexpected error:', errorMessage);
    return createErrorResponse('Unexpected error', 500);
  }
};
