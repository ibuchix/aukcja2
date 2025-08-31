
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning, logDebug, logAuthAttempt } from "./logging.ts";
import { preparePassword } from "./password-utils.ts";
import { sanitizeString } from "./sanitization-utils.ts";
import { createSecureAuthAudit } from "./security-validator.ts";

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
    logDebug("Login credentials prepared for authentication", { 
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });

    try {
      // Log admin client configuration
      logDebug("Supabase admin client config", {
        url_exists: !!Deno.env.get("SUPABASE_URL"),
        key_length: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.length || 0,
        auth_header_exists: !!supabaseAdmin.auth,
      });

      // Simplified authentication flow
      // Use signInWithPassword which handles both verification and session creation
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword
      });

      if (signInError) {
        // Create secure audit log for failed login
        const auditLog = createSecureAuthAudit(
          "login", 
          normalizedEmail, 
          false, 
          requestId
        );
        logAuthAttempt("login", normalizedEmail, false, { 
          requestId, 
          error: signInError.message 
        });
        logError(`Login authentication error: ${signInError.message}`, { 
          requestId,
          email: normalizedEmail,
          errorCode: signInError.code || 'unknown'
        });
        return respondError("Invalid login credentials", 401);
      }

      if (!signInData || !signInData.user) {
        logWarning(`Login failed - no user returned for email: ${normalizedEmail}`);
        return respondError("Authentication failed", 401);
      }

      // Get dealer profile info to return
      const { data: dealerData, error: dealerError } = await supabaseAdmin
        .from('dealers')
        .select('*')
        .eq('user_id', signInData.user.id)
        .single();

      if (dealerError) {
        logWarning(`Error fetching dealer profile (request ID: ${requestId})`, dealerError);
        // Continue to check restriction based on existence
      }

      // Enforce dealer-only access: user must have a dealer record
      if (!dealerData) {
        logWarning(
          `Dealer-only restriction: user ${signInData.user.id} (${normalizedEmail}) attempted login without dealer record`,
          null
        );
        return respondError("This app is restricted to dealer accounts. Please register as a dealer.", 403);
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

      // Log successful login with secure audit trail
      const auditLog = createSecureAuthAudit(
        "login", 
        normalizedEmail, 
        true, 
        requestId
      );
      logInfo(`Login successful for user: ${signInData.user.id}`, {
        userId: signInData.user.id,
        email: normalizedEmail,
        timestamp: auditLog.timestamp,
        requestId
      });

      // Return success with session and user data
      return respondSuccess({
        success: true,
        session: signInData.session,
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
