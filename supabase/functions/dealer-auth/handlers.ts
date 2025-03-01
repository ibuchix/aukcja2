
import { supabase } from "../_shared/supabase-client.ts";
import { logOperation, logError, logAuthEvent } from "./logging.ts";
import { createResponse, errorResponse, successResponse, sanitizeError } from "./response-utils.ts";
import { LoginRequest, RegistrationRequest } from "./types.ts";

// Function for checking if email exists
export const checkEmailExists = async (req: Request) => {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return errorResponse('Email is required', 400);
    }

    logOperation('Checking if email exists', { email });
    
    const { data, error } = await supabase.auth.admin.listUsers({ 
      filters: { email }
    });

    if (error) {
      logError('Error checking if email exists', error);
      return errorResponse(sanitizeError(error), 500);
    }

    return successResponse({
      exists: (data?.users?.length || 0) > 0
    });
  } catch (error) {
    logError('Unexpected error in checkEmailExists', error);
    return errorResponse(sanitizeError(error), 500);
  }
};

// Login function - updated to use the new response utilities
export const login = async (req: Request) => {
  try {
    const { email, password } = await req.json() as LoginRequest;
    
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    logOperation('Login attempt', { email });
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email, password
    });

    if (authError) {
      logError('Login error', authError);
      return errorResponse('Invalid email or password', 401);
    }

    // Get dealer profile
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (dealerError) {
      logError('Error fetching dealer profile', dealerError);
    }

    return successResponse({
      session: authData.session,
      dealer: dealerData || null
    });
  } catch (error) {
    logError('Unexpected error in login', error);
    return errorResponse(sanitizeError(error), 500);
  }
};

// Registration function with lock mechanism - updated to use the new response utilities
export const registerWithLock = async (req: Request, registrationLocks: Map<string, boolean>) => {
  try {
    const body = await req.json() as RegistrationRequest;
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Check if registration is already in progress for this email
    if (registrationLocks.get(email)) {
      return errorResponse('Registration for this email is already in progress. Please try again in a moment.', 429);
    }

    // Set lock
    registrationLocks.set(email, true);
    logOperation('Registration with lock started', { email });

    try {
      // Perform the registration using the database function
      const { data, error } = await supabase.rpc('create_dealer_with_profile', {
        p_email: email,
        p_password: password,
        p_supervisor_name: body.supervisorName || '',
        p_company_name: body.companyName || '',
        p_tax_id: body.taxId || '',
        p_business_registry_number: body.businessRegistryNumber || '',
        p_address: body.companyAddress || ''
      });

      if (error) {
        logError('Registration error', error);
        return errorResponse(sanitizeError(error), 400);
      }

      return successResponse(data);
    } finally {
      // Always release the lock
      registrationLocks.delete(email);
      logOperation('Registration lock released', { email });
    }
  } catch (error) {
    logError('Unexpected error in registration', error);
    return errorResponse(sanitizeError(error), 500);
  }
};

// Export all handlers in a map for easy access
export const handlers = {
  'check-email-exists': checkEmailExists,
  'login': login,
  'register-with-lock': registerWithLock
};
