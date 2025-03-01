
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createResponse, createErrorResponse } from "./response-utils.ts";
import { logInfo, logError, logWarning } from "./logging.ts";
import { 
  DealerAuthRequest, 
  DealerRegistrationData,
  LoginData,
  CheckEmailData 
} from "./types.ts";

// Create a Supabase client with the service role key
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Handles dealer registration
 */
export async function handleRegistration(
  request: Request,
  requestData: DealerRegistrationData
): Promise<Response> {
  try {
    // Extract needed fields
    const { 
      email, 
      password, 
      supervisorName, 
      companyName, 
      taxId, 
      businessRegistryNumber, 
      companyAddress 
    } = requestData;

    if (!email || !password || !supervisorName) {
      return createErrorResponse(
        "Required fields missing",
        400,
        { details: "Email, password, and supervisor name are required" }
      );
    }

    logInfo(`Attempting to register dealer with email ${email}`);

    // First check if user exists using admin API
    const { data: existingUsers, error: lookupError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filters: [
        {
          property: 'email',
          operator: 'eq',
          value: email,
        },
      ],
    });

    if (lookupError) {
      logError(`Error checking if user exists: ${lookupError.message}`);
      return createErrorResponse(
        "Failed to check if user exists",
        500,
        { details: lookupError.message }
      );
    }

    // If user exists, return error
    if (existingUsers && existingUsers.users.length > 0) {
      logWarning(`User with email ${email} already exists`);
      return createErrorResponse(
        "User with this email already exists",
        400,
        { details: "An account with this email already exists. Please login instead." }
      );
    }

    // Create user with admin API - this is more reliable than signUp
    const { data: { user }, error: signUpError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        name: supervisorName,
        role: 'dealer'
      }
    });

    if (signUpError || !user) {
      logError(`Failed to create user: ${signUpError?.message || "No user returned"}`);
      return createErrorResponse(
        "Registration failed",
        500,
        { details: signUpError?.message || "Failed to create user account" }
      );
    }

    // Verify password was set
    if (!user.encrypted_password) {
      logError("Password not set during registration - deleting incomplete user");
      await supabaseClient.auth.admin.deleteUser(user.id);
      return createErrorResponse(
        "Password not set during registration",
        500,
        { details: "Failed to secure account properly. Please try again." }
      );
    }

    // Use the create_dealer_with_profile database function to create dealer profile
    const { data: dealerData, error: dealerError } = await supabaseClient.rpc(
      'create_dealer_with_profile',
      {
        p_email: email,
        p_password: password,
        p_supervisor_name: supervisorName,
        p_company_name: companyName || '',
        p_tax_id: taxId || '',
        p_business_registry_number: businessRegistryNumber || '',
        p_address: companyAddress || ''
      }
    );

    if (dealerError) {
      logError(`Error creating dealer profile: ${dealerError.message}`);
      
      // If dealer profile creation fails, delete the user to maintain consistency
      await supabaseClient.auth.admin.deleteUser(user.id);
      
      return createErrorResponse(
        "Failed to create dealer profile",
        500,
        { details: dealerError.message }
      );
    }

    logInfo(`Successfully registered dealer with email ${email}, user ID: ${user.id}`);

    // Return success
    return createResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    });
  } catch (error) {
    logError(`Unexpected error in handleRegistration: ${error.message}`);
    return createErrorResponse(
      error.message || "Registration failed",
      500
    );
  }
}

/**
 * Handles dealer login
 */
export async function handleLogin(
  request: Request,
  requestData: LoginData
): Promise<Response> {
  try {
    const { email, password } = requestData;

    if (!email || !password) {
      return createErrorResponse(
        "Email and password are required",
        400
      );
    }

    logInfo(`Attempting login for user ${email}`);

    // Use signInWithPassword for consistency with frontend auth flow
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logWarning(`Login failed for ${email}: ${error.message}`);
      return createErrorResponse(
        "Invalid login credentials",
        400,
        { details: error.message }
      );
    }

    // Verify user has dealer role in profiles
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profileData) {
      logWarning(`User ${email} has no profile or is not a dealer`);
      return createErrorResponse(
        "Account is not registered as a dealer",
        403,
        { details: "This account is not configured as a dealer account" }
      );
    }

    logInfo(`Login successful for user ${email}`);

    return createResponse({
      success: true,
      user: data.user,
      session: data.session
    });
  } catch (error) {
    logError(`Unexpected error in handleLogin: ${error.message}`);
    return createErrorResponse(
      error.message || "Login failed",
      500
    );
  }
}

/**
 * Checks if an email exists
 */
export async function handleCheckEmailExists(
  request: Request,
  requestData: CheckEmailData
): Promise<Response> {
  try {
    const { email } = requestData;

    if (!email) {
      return createErrorResponse(
        "Email is required", 
        400
      );
    }

    logInfo(`Checking if email exists: ${email}`);

    // Use admin API to check if email exists
    const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filters: [
        {
          property: 'email',
          operator: 'eq',
          value: email,
        },
      ],
    });

    if (usersError) {
      logError(`Error checking if email exists: ${usersError.message}`);
      return createErrorResponse(
        "Failed to check if email exists",
        500,
        { details: usersError.message }
      );
    }

    const exists = users && users.users.length > 0;
    logInfo(`Email ${email} exists: ${exists}`);

    return createResponse({
      exists
    });
  } catch (error) {
    logError(`Unexpected error in handleCheckEmailExists: ${error.message}`);
    return createErrorResponse(
      error.message || "Failed to check email",
      500
    );
  }
}

/**
 * Handle request based on action
 */
export async function handleRequest(
  request: Request,
  requestData: DealerAuthRequest
): Promise<Response> {
  const { action } = requestData;

  switch (action) {
    case "register":
      return handleRegistration(request, requestData as DealerRegistrationData);
    case "login":
      return handleLogin(request, requestData as LoginData);
    case "check-email-exists":
      return handleCheckEmailExists(request, requestData as CheckEmailData);
    default:
      return createErrorResponse(
        `Unsupported action: ${action}`,
        400
      );
  }
}
