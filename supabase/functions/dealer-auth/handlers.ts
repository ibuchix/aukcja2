import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning, logDebug } from "./logging.ts";
import { preparePassword } from "./password-utils.ts";

// Initialize the Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

type RegistrationMetadata = {
  name: string;
  companyName?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
  phoneNumber?: string;
};

/**
 * Handle dealer registration
 */
export async function handleDealerRegister(
  body: any,
  requestId: string
): Promise<Response> {
  try {
    const { email, password, metadata = {}, passwordless = false } = body;
    
    logInfo(`Processing registration for email: ${email}, passwordless: ${passwordless}, request ID: ${requestId}`);

    if (!email) {
      return respondError("Email is required", 400);
    }

    if (!password) {
      return respondError("Password is required for dealer registration", 400);
    }

    // Validate required metadata
    if (!metadata.name) {
      return respondError("Name is required in metadata", 400);
    }

    // Sanitize and prepare metadata
    const cleanedMetadata = sanitizeMetadata(metadata);

    // Double-check if email already exists to prevent race conditions
    const { data: existsData, error: existsError } = await supabaseAdmin.rpc(
      "check_email_exists",
      { email_to_check: sanitizeString(email).toLowerCase() }
    );

    if (existsError) {
      logError("Error checking if email exists", existsError);
      // Continue despite this error - the procedure will check again
    } else if (existsData?.exists) {
      logWarning(`Email ${email} already exists. Rejecting registration attempt.`);
      return respondError("Email already exists", 409);
    }

    // Normalize password with our standardized function
    const normalizedPassword = preparePassword(password);
    logDebug("Password normalization complete", { 
      originalLength: password.length, 
      normalizedLength: normalizedPassword.length,
      // Log first and last character code for debugging (without revealing the actual password)
      firstCharCode: normalizedPassword.charCodeAt(0),
      lastCharCode: normalizedPassword.charCodeAt(normalizedPassword.length - 1)
    });

    // Normalize phone number by removing spaces and ensuring it starts with +
    const normalizedPhone = cleanedMetadata.phoneNumber || "";
    const formattedPhone = normalizedPhone.replace(/\s+/g, '');
    const phoneWithCode = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;

    // Call the improved stored procedure to handle the dealer registration
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      "create_dealer_with_profile",
      {
        p_email: sanitizeString(email).toLowerCase(),
        p_password: normalizedPassword,
        p_supervisor_name: cleanedMetadata.name,
        p_company_name: cleanedMetadata.companyName || cleanedMetadata.name,
        p_tax_id: (cleanedMetadata.taxId || "").replace(/\D/g, ''), // Remove non-digits
        p_business_registry_number: (cleanedMetadata.businessRegistryNumber || "").replace(/\D/g, ''), // Remove non-digits
        p_address: cleanedMetadata.companyAddress || "",
        p_phone_number: phoneWithCode
      }
    );

    if (rpcError) {
      logError(`RPC error during registration (request ID: ${requestId})`, rpcError);
      
      // Check for duplicate key errors
      if (rpcError.message?.includes("duplicate") || 
          rpcError.message?.includes("already exists") ||
          rpcError.message?.toLowerCase().includes("unique violation")) {
        if (rpcError.message?.includes("email")) {
          return respondError("An account with this email already exists", 409);
        }
        if (rpcError.message?.toLowerCase().includes("tax_id")) {
          return respondError("This tax ID is already registered", 409);
        }
        if (rpcError.message?.toLowerCase().includes("business_registry_number")) {
          return respondError("This business registry number is already registered", 409);
        }
        return respondError("A duplicate entry was detected", 409);
      }
      
      // Internal server errors
      return respondError(
        `Registration failed: ${rpcError.message}`,
        500
      );
    }

    if (!result) {
      logError(`Empty result from registration RPC (request ID: ${requestId})`, null);
      return respondError("Registration failed with no result", 500);
    }

    if (!result.success) {
      logError(`Registration unsuccessful (request ID: ${requestId})`, result);
      return respondError(
        result.error || "Registration failed for unknown reason",
        result.error_code === "unique_violation" ? 409 : 500
      );
    }

    // Check for warnings (partial success)
    if (result.warning) {
      logWarning(`Registration partial success (request ID: ${requestId}): ${result.warning}`);
      
      // Return partial success response
      return respondSuccess({
        success: true,
        partialSuccess: true,
        warning: result.warning,
        userId: result.user?.id,
        message: "Account created but with some limitations. You may need to complete profile setup."
      });
    }

    // Successfully created user
    logInfo(`User registered successfully (request ID: ${requestId}): ${result.user?.id}`);
    
    // For passwordless registration, add a special note in the response message
    const message = passwordless 
      ? "Registration successful. You will receive a login code via email when you sign in."
      : "Registration successful. Please check your email for verification.";
    
    return respondSuccess({
      success: true,
      userId: result.user?.id,
      message: message
    });
  } catch (error) {
    logError(`Unexpected error in registration handler (request ID: ${requestId})`, error);
    return respondError(
      `Registration failed unexpectedly: ${error.message}`,
      500
    );
  }
}

/**
 * Handle dealer login
 */
export async function handleDealerLogin(
  body: any,
  requestId: string
): Promise<Response> {
  try {
    const { email, password } = body;
    
    logInfo(`Processing login for email: ${email}, request ID: ${requestId}`);

    if (!email) {
      return respondError("Email is required", 400);
    }

    if (!password) {
      return respondError("Password is required", 400);
    }

    // Normalize email
    const normalizedEmail = sanitizeString(email).toLowerCase();
    
    // Normalize password with our standardized function
    const normalizedPassword = preparePassword(password);
    logDebug("Login password normalization complete", { 
      originalLength: password.length, 
      normalizedLength: normalizedPassword.length,
      firstCharCode: normalizedPassword.charCodeAt(0),
      lastCharCode: normalizedPassword.charCodeAt(normalizedPassword.length - 1)
    });

    // Fix: Use raw SQL query instead of incorrect query syntax
    const { data: users, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1);

    if (userError) {
      logError(`Error fetching user for login (request ID: ${requestId})`, userError);
      
      // Try alternative approach if the first method fails
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail);
        
        if (authError || !authUser) {
          return respondError("Invalid login credentials", 401);
        }
        
        // Use the user from the admin API
        const userData = authUser;
        
        // Continue with authentication using this user data
        // Verify password using our RPC function
        const { data: verificationData, error: verificationError } = await supabaseAdmin.rpc(
          "verify_password",
          { 
            uuid: userData.id,
            plain_text: normalizedPassword
          }
        );

        if (verificationError || !verificationData) {
          return respondError("Invalid login credentials", 401);
        }

        // Create session and continue normal flow...
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
          userId: userData.id,
          properties: {
            source: "dealer_auth_edge_function"
          }
        });

        if (sessionError) {
          logError(`Session creation error (request ID: ${requestId})`, sessionError);
          return respondError("Failed to create session", 500);
        }

        // Get dealer profile
        const { data: dealerData, error: dealerError } = await supabaseAdmin
          .from('dealers')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        return respondSuccess({
          success: true,
          session: sessionData.session,
          user: {
            id: userData.id,
            email: normalizedEmail,
            dealerProfile: dealerData || null
          }
        });
      } catch (fallbackError) {
        logError(`Fallback auth error (request ID: ${requestId})`, fallbackError);
        return respondError("Authentication failed", 401);
      }
    }

    const userData = users && users[0];
    if (!userData) {
      logWarning(`User not found for login attempt: ${normalizedEmail}`);
      return respondError("Invalid login credentials", 401);
    }

    // Verify password using our RPC function
    const { data: verificationData, error: verificationError } = await supabaseAdmin.rpc(
      "verify_password",
      { 
        uuid: userData.id,
        plain_text: normalizedPassword
      }
    );

    if (verificationError) {
      logError(`Password verification error (request ID: ${requestId})`, verificationError);
      return respondError("Authentication service error", 500);
    }

    if (!verificationData) {
      logWarning(`Password verification failed for user: ${userData.id}`);
      return respondError("Invalid login credentials", 401);
    }

    // If verification successful, create a session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      userId: userData.id,
      properties: {
        source: "dealer_auth_edge_function"
      }
    });

    if (sessionError) {
      logError(`Session creation error (request ID: ${requestId})`, sessionError);
      return respondError("Failed to create session", 500);
    }

    // Get dealer profile info to return
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (dealerError) {
      logWarning(`Error fetching dealer profile (request ID: ${requestId})`, dealerError);
      // Continue despite this error - we'll return minimal info
    }

    // Get user profile info
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (profileError) {
      logWarning(`Error fetching user profile (request ID: ${requestId})`, profileError);
      // Continue despite this error - we'll return minimal info
    }

    // Log successful login
    logInfo(`Login successful for user: ${userData.id}, email: ${normalizedEmail}`);

    // Return success with session and user data
    return respondSuccess({
      success: true,
      session: sessionData.session,
      user: {
        id: userData.id,
        email: normalizedEmail,
        dealerProfile: dealerData || null,
        profile: profileData || null
      }
    });
  } catch (error) {
    logError(`Unexpected error in login handler (request ID: ${requestId})`, error);
    return respondError(
      `Login failed unexpectedly: ${error.message}`,
      500
    );
  }
}

/**
 * Sanitize and validate registration metadata
 */
function sanitizeMetadata(metadata: any): RegistrationMetadata {
  return {
    name: sanitizeString(metadata.name),
    companyName: sanitizeString(metadata.companyName),
    taxId: sanitizeString(metadata.taxId),
    businessRegistryNumber: sanitizeString(metadata.businessRegistryNumber),
    companyAddress: sanitizeString(metadata.companyAddress),
    phoneNumber: sanitizeString(metadata.phoneNumber)
  };
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: any): string {
  if (typeof value !== "string") return "";
  return value.trim();
}
