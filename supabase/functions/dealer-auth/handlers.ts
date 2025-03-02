
import { HttpError } from "../_shared/error-handling.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { RegisterRequest, CheckEmailRequest, LoginRequest } from "./types.ts";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logError, logInfo } from "./logging.ts";

// Simple utility to create errors with a consistent format
function createError(message: string, statusCode = 400) {
  return new HttpError(message, statusCode);
}

/**
 * Handles dealer registration
 */
export async function handleRegister(request: RegisterRequest) {
  if (!request.email || !request.password || !request.metadata?.name) {
    return respondError("Missing required fields", 400);
  }

  try {
    // First check if user with this email already exists
    const userExists = await checkEmailExists(request.email);
    if (userExists.exists) {
      return respondError("A user with this email already exists", 409);
    }

    // Create a new Supabase service client
    const supabaseAdmin = createServiceClient();

    // Use our custom RPC function to create the dealer with profile
    const { data, error } = await supabaseAdmin.rpc('create_dealer_with_profile', {
      p_email: request.email,
      p_password: request.password,
      p_supervisor_name: request.metadata.name,
      p_company_name: request.metadata.companyName || '',
      p_tax_id: request.metadata.taxId || '',
      p_business_registry_number: request.metadata.businessRegistryNumber || '',
      p_address: request.metadata.companyAddress || ''
    });

    if (error) {
      logError(`Error creating dealer: ${error.message}`, { error });
      if (error.message.includes("already exists")) {
        return respondError("A user with this email already exists", 409);
      }
      return respondError(`Error creating user: ${error.message}`, 500);
    }

    logInfo("Dealer registered successfully", { userId: data?.user?.id });
    
    return respondSuccess({
      success: true,
      user: data?.user,
      message: "Registration successful. Please check your email for verification."
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return respondError(`Error in registration: ${errorMessage}`, 500);
  }
}

/**
 * Checks if an email already exists in the system
 * Using multiple methods for robustness
 */
export async function checkEmailExists(email: string) {
  try {
    // Create a service role client to check the database
    const supabaseAdmin = createServiceClient();
    
    // Try multiple approaches to check if the email exists
    
    // First attempt: Use check_email_exists RPC function (schema-agnostic approach)
    try {
      // Try the function in the public schema
      const { data: publicData, error: publicError } = await supabaseAdmin.rpc('check_email_exists', { 
        email_to_check: email.toLowerCase().trim() 
      });
      
      if (!publicError) {
        // If successfully called, check the response format
        if (typeof publicData === 'number') {
          return { exists: publicData > 0 };
        } else if (publicData && typeof publicData === 'object' && 'exists' in publicData) {
          return { exists: Boolean(publicData.exists) };
        }
      }
      
      // If we got here, first attempt failed, log and try the second method
      logError("First RPC method failed, trying alternative", { error: publicError });
    } catch (e) {
      // Silently fail and try next method
      logError("Error in first RPC attempt", { error: e });
    }
    
    // Second attempt: Direct query to auth.users (more reliable but requires service role)
    try {
      const { data: userData, error: userError } = await supabaseAdmin.from('auth.users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .limit(1);
        
      if (userError) {
        logError("Error in direct auth.users query", { error: userError });
      } else {
        return { exists: Array.isArray(userData) && userData.length > 0 };
      }
    } catch (e) {
      logError("Error in direct query attempt", { error: e });
    }
    
    // Fallback: Just return false if all methods fail (assume user doesn't exist)
    logError("All email check methods failed, assuming user doesn't exist", {});
    return { exists: false };
  } catch (error) {
    logError("Fatal error checking if email exists", { error });
    throw new HttpError("Error checking user existence", 500);
  }
}

/**
 * Handles checking if an email exists from an external request
 */
export async function handleCheckEmailExists(request: CheckEmailRequest) {
  if (!request.email) {
    return respondError("Email is required", 400);
  }

  try {
    const result = await checkEmailExists(request.email);
    return respondSuccess(result);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return respondError(message, statusCode);
  }
}

/**
 * Handles dealer login
 */
export async function handleLogin(request: LoginRequest) {
  if (!request.email || !request.password) {
    return respondError("Email and password are required", 400);
  }

  try {
    // Create a new Supabase service client
    const supabaseAdmin = createServiceClient();

    // Sign in the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });

    if (authError) {
      logError(`Login failed: ${authError.message}`, { error: authError });
      return respondError("Invalid email or password", 401);
    }

    if (!authData.user) {
      return respondError("Login failed: User not found", 404);
    }

    // Get dealer profile information
    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (dealerError && !dealerError.message.includes('No rows found')) {
      logError(`Error fetching dealer profile: ${dealerError.message}`, { error: dealerError });
    }

    logInfo("Login successful", { userId: authData.user.id });

    return respondSuccess({
      success: true,
      session: authData.session,
      dealer,
    });

  } catch (error) {
    const statusCode = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return respondError(message, statusCode);
  }
}
