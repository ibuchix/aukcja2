import { logOperation, logError } from "./logging.ts";
import { supabase } from "../_shared/supabase-client.ts";
import { 
  createResponse, 
  errorResponse, 
  successResponse,
  sanitizeError
} from './response-utils.ts';

// Define payload types
type RegisterPayload = {
  email: string;
  password: string;
  supervisorName: string;
  companyName: string;
  phoneNumber?: string;
  taxId: string;
  businessRegistryNumber: string;
  companyAddress: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type EmailCheckPayload = {
  email: string;
};

// Export all handlers through a single object
export const handlers = {
  register: handleRegistration,
  login: handleLogin,
  'check-email-exists': handleEmailExists,
  'register-with-lock': handleRegistrationWithLock,
};

// Handler for email existence check
export const handleEmailExists = async (req: Request) => {
  try {
    const payload = await req.json() as EmailCheckPayload;
    
    logOperation('Checking if email exists', { email: payload.email });
    
    if (!payload.email || typeof payload.email !== 'string') {
      return errorResponse('Email is required', 400);
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', payload.email.toLowerCase())
      .maybeSingle();
      
    if (error) {
      logError('Error checking email existence', error);
      return errorResponse('Failed to check email', 500);
    }
    
    return successResponse({ exists: !!data });
    
  } catch (error) {
    logError('Unexpected error in email check', error);
    return errorResponse('Failed to check email', 500);
  }
};

// Handler for user registration
export const handleRegistration = async (req: Request) => {
  try {
    const payload = await req.json() as RegisterPayload;
    
    // Validate required fields
    if (!payload.email || !payload.password || !payload.supervisorName) {
      return errorResponse('Missing required fields', 400);
    }
    
    logOperation('Starting registration', { email: payload.email });
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email.toLowerCase(),
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        name: payload.supervisorName,
        company_name: payload.companyName
      }
    });
    
    if (authError) {
      logError('Auth error during registration', authError);
      return errorResponse(sanitizeError(authError), 400);
    }
    
    const userId = authData.user.id;
    
    // Create dealer profile
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: userId,
        supervisor_name: payload.supervisorName,
        dealership_name: payload.companyName,
        tax_id: payload.taxId,
        business_registry_number: payload.businessRegistryNumber,
        address: payload.companyAddress,
        verification_status: 'pending',
        is_verified: false,
        license_number: payload.businessRegistryNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (dealerError) {
      logError('Dealer profile creation error', dealerError);
      
      // Attempt to clean up the auth user
      await supabase.auth.admin.deleteUser(userId);
      
      return errorResponse(sanitizeError(dealerError), 400);
    }
    
    logOperation('Registration successful', { userId });
    
    return successResponse({
      user: {
        id: userId,
        email: payload.email
      }
    });
    
  } catch (error) {
    logError('Unexpected registration error', error);
    return errorResponse('Registration failed', 500);
  }
};

export const handleRegistrationWithLock = async (req: Request, locks: Map<string, boolean>) => {
  try {
    const payload = await req.json() as RegisterPayload;
    const { email } = payload;

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    const normalizedEmail = email.toLowerCase();

    // Use a lock key based on the normalized email
    const lockKey = `registration_lock_${normalizedEmail}`;

    // Check if registration is already in progress for this email
    if (locks.get(lockKey)) {
      console.warn(`Registration already in progress for email: ${normalizedEmail}`);
      return errorResponse('Registration already in progress. Please try again in a moment.', 429);
    }

    // Acquire the lock
    locks.set(lockKey, true);
    console.log(`Acquired lock for email: ${normalizedEmail}`);

    try {
      logOperation('Starting registration with lock', { email: normalizedEmail });

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          name: payload.supervisorName,
          company_name: payload.companyName
        }
      });

      if (authError) {
        logError('Auth error during registration with lock', authError);
        return errorResponse(sanitizeError(authError), 400);
      }

      const userId = authData.user.id;

      // Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: userId,
          supervisor_name: payload.supervisorName,
          dealership_name: payload.companyName,
          tax_id: payload.taxId,
          business_registry_number: payload.businessRegistryNumber,
          address: payload.companyAddress,
          verification_status: 'pending',
          is_verified: false,
          license_number: payload.businessRegistryNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dealerError) {
        logError('Dealer profile creation error with lock', dealerError);

        // Attempt to clean up the auth user
        await supabase.auth.admin.deleteUser(userId);

        return errorResponse(sanitizeError(dealerError), 400);
      }

      logOperation('Registration with lock successful', { userId });

      return successResponse({
        user: {
          id: userId,
          email: normalizedEmail
        }
      });

    } finally {
      // Release the lock
      locks.delete(lockKey);
      console.log(`Released lock for email: ${normalizedEmail}`);
    }

  } catch (error) {
    logError('Unexpected registration error with lock', error);
    return errorResponse('Registration failed', 500);
  }
};

export const handleLogin = async (req: Request) => {
  try {
    const payload = await req.json() as LoginPayload;
    
    if (!payload.email || !payload.password) {
      return errorResponse('Email and password are required', 400);
    }
    
    logOperation('Attempting login', { email: payload.email });
    
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email.toLowerCase(),
      password: payload.password,
    });
    
    if (error) {
      logError('Login error', error);
      return errorResponse('Invalid login credentials', 401);
    }
    
    if (!data.user || !data.session) {
      return errorResponse('Login failed - no session created', 500);
    }
    
    // Get dealer profile
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
      
    if (dealerError && dealerError.code !== 'PGRST116') {
      logError('Error fetching dealer profile', dealerError);
      // Continue anyway, as authentication succeeded
    }
    
    logOperation('Login successful', { userId: data.user.id });
    
    return successResponse({
      session: data.session,
      dealer: dealerData || null
    });
    
  } catch (error) {
    logError('Unexpected login error', error);
    return errorResponse('Login failed', 500);
  }
};
