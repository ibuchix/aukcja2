import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning, logDebug } from "./logging.ts";
import { preparePassword } from "./password-utils.ts";

// Initialize the Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Ensure correct case for headers
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      }
    }
  }
);

// Verify environment variables are available
const envCheck = () => {
  const vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = vars.filter(v => !Deno.env.get(v));
  if (missing.length > 0) {
    logError(`Missing environment variables: ${missing.join(", ")}`, null);
    return false;
  }
  return true;
};

// Check environment on module load
envCheck();

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

    // Use direct admin API to create user with confirmed email
    // This avoids the need for email verification
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizeString(email).toLowerCase(),
      password: normalizedPassword,
      email_confirm: true, // Explicitly confirm email
      user_metadata: {
        name: cleanedMetadata.name,
        role: 'dealer'
      },
      phone: phoneWithCode || undefined
    });

    if (userError) {
      logError(`Error creating user (request ID: ${requestId})`, userError);
      
      // Check for duplicate key errors
      if (userError.message?.includes("duplicate") || 
          userError.message?.includes("already exists") ||
          userError.message?.toLowerCase().includes("unique violation")) {
        if (userError.message?.includes("email")) {
          return respondError("An account with this email already exists", 409);
        }
        return respondError("A duplicate entry was detected", 409);
      }
      
      // Internal server errors
      return respondError(
        `Registration failed: ${userError.message}`,
        500
      );
    }
    
    if (!userData || !userData.user) {
      logError(`Empty result from user creation (request ID: ${requestId})`, null);
      return respondError("Registration failed with no result", 500);
    }

    // Create dealer profile
    try {
      const { error: dealerError } = await supabaseAdmin
        .from('dealers')
        .insert({
          user_id: userData.user.id,
          supervisor_name: cleanedMetadata.name,
          dealership_name: cleanedMetadata.companyName || cleanedMetadata.name,
          tax_id: (cleanedMetadata.taxId || "").replace(/\D/g, ''),
          business_registry_number: (cleanedMetadata.businessRegistryNumber || "").replace(/\D/g, ''),
          address: cleanedMetadata.companyAddress || "",
          verification_status: 'pending',
          is_verified: false,
          license_number: (cleanedMetadata.businessRegistryNumber || "").replace(/\D/g, ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dealerError) {
        logError("Error creating dealer profile:", dealerError);
        // Continue despite error - we'll return a warning
      }
    } catch (profileError) {
      logWarning("Error creating dealer profile:", profileError);
      // Continue despite error - we'll return a warning
    }

    // Create profile with dealer role
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userData.user.id,
          role: 'dealer',
          full_name: cleanedMetadata.name,
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        logWarning("Error creating profile:", profileError);
      }
    } catch (metaError) {
      logWarning("Error creating profile:", metaError);
    }

    // Create a session immediately so the user can be logged in right after registration
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      userId: userData.user.id
    });

    if (sessionError) {
      logWarning(`Error creating immediate session for user ${userData.user.id}:`, sessionError);
      // Continue despite error - login will still work manually
    }

    // Successfully created user
    logInfo(`User registered successfully (request ID: ${requestId}): ${userData.user.id}`);
    
    // Return success with session if available
    return respondSuccess({
      success: true,
      userId: userData.user.id,
      user: userData.user,
      session: sessionData?.session || null,
      message: "Registration successful. You can now log in to your account."
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

    // Environment validation step
    if (!envCheck()) {
      return respondError(
        "Server configuration error: Missing environment variables", 
        500
      );
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

    try {
      // Use built-in Supabase authentication
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword
      });

      if (signInError) {
        logError(`Login authentication error: ${signInError.message}`, signInError);
        return respondError("Invalid login credentials", 401);
      }

      if (!signInData || !signInData.user) {
        logWarning(`Login failed - no user returned for email: ${normalizedEmail}`);
        return respondError("Authentication failed", 401);
      }

      // Authentication succeeded, now create a session
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
        userId: signInData.user.id
      });

      if (sessionError) {
        logError(`Session creation error (request ID: ${requestId})`, sessionError);
        return respondError("Failed to create session", 500);
      }

      // Get dealer profile info to return
      const { data: dealerData, error: dealerError } = await supabaseAdmin
        .from('dealers')
        .select('*')
        .eq('user_id', signInData.user.id)
        .single();

      if (dealerError) {
        logWarning(`Error fetching dealer profile (request ID: ${requestId})`, dealerError);
        // Continue despite this error - we'll return minimal info
      }

      // Get user profile info
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        logWarning(`Error fetching user profile (request ID: ${requestId})`, profileError);
        // Continue despite this error - we'll return minimal info
      }

      // Log successful login
      logInfo(`Login successful for user: ${signInData.user.id}, email: ${normalizedEmail}`);

      // Return success with session and user data
      return respondSuccess({
        success: true,
        session: sessionData.session,
        user: {
          id: signInData.user.id,
          email: normalizedEmail,
          dealerProfile: dealerData || null,
          profile: profileData || null
        }
      });
    } catch (authError) {
      logError(`Unexpected authentication error (request ID: ${requestId})`, authError);
      return respondError(
        `Authentication failed unexpectedly: ${authError.message}`,
        500
      );
    }
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
