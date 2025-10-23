import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError } from "./logging.ts";

const RESET_TOKEN_EXPIRY_HOURS = 1;

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
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      }
    }
  }
);

interface PasswordResetRequestBody {
  email: string;
  taxId: string;
  businessRegistryNumber: string;
  supervisorName: string;
}

interface PasswordResetConfirmBody {
  token: string;
  newPassword: string;
}

/**
 * Generate a secure random token
 */
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Handle password reset request
 */
export async function handlePasswordResetRequest(
  body: any,
  requestId: string
): Promise<Response> {
  const { email, taxId, businessRegistryNumber, supervisorName } = body;

  logInfo("Password reset request", { requestId, email: email?.substring(0, 3) + "***" });

  // Validate input
  if (!email || !taxId || !businessRegistryNumber || !supervisorName) {
    return respondError("All fields are required for password reset", 400, requestId);
  }

  try {
    // Verify dealer exists with matching information
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      logError("Error fetching users", userError, requestId);
      return respondError("Unable to process request", 500, requestId);
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if user exists - security best practice
      logInfo("Password reset requested for non-existent email", { requestId });
      return respondSuccess({ message: "If the account exists, a password reset email will be sent" }, requestId);
    }

    // Verify dealer information matches
    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from("dealers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (dealerError || !dealer) {
      logError("Dealer not found", dealerError, requestId);
      return respondSuccess({ message: "If the account exists, a password reset email will be sent" }, requestId);
    }

    // Verify all details match
    const detailsMatch = 
      dealer.tax_id === taxId &&
      dealer.business_registry_number === businessRegistryNumber &&
      dealer.supervisor_name === supervisorName;

    if (!detailsMatch) {
      logInfo("Password reset details don't match", { requestId });
      
      // Log audit event
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "password_reset_failed_verification",
        details: { reason: "Details mismatch" }
      });

      return respondSuccess({ message: "If the account exists, a password reset email will be sent" }, requestId);
    }

    // Check if a recent token exists (within last 2 minutes) to prevent duplicates
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
    
    const { data: existingToken } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("token, created_at")
      .eq("user_id", user.id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .gt("created_at", twoMinutesAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let token: string;
    
    if (existingToken) {
      // Use existing recent token instead of creating a new one
      token = existingToken.token;
      logInfo("Using existing recent reset token", { requestId, userId: user.id });
    } else {
      // Generate new reset token
      token = generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

      // Store token in database
      const { error: tokenError } = await supabaseAdmin
        .from("password_reset_tokens")
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        logError("Error creating reset token", tokenError, requestId);
        return respondError("Unable to process request", 500, requestId);
      }
      
      logInfo("New password reset token created", { requestId, userId: user.id });
    }

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "password_reset_requested",
      details: { email }
    });

    // Call email function to send reset link (only if we created a new token or this is first attempt)
    if (!existingToken) {
      try {
        const emailResponse = await supabaseAdmin.functions.invoke("send-password-reset", {
          body: {
            email,
            token,
            dealershipName: dealer.dealership_name
          }
        });

        if (emailResponse.error) {
          logError("Error sending reset email", emailResponse.error, requestId);
          // Don't fail the request if email fails - token is still valid
        } else {
          logInfo("Password reset email sent successfully", { requestId, userId: user.id });
        }
      } catch (emailError) {
        logError("Exception sending reset email", emailError, requestId);
        // Don't fail the request if email fails - token is still valid
      }
    } else {
      logInfo("Skipped email send - using existing token", { requestId, userId: user.id });
    }

    return respondSuccess({ 
      message: "If the account exists, a password reset email will be sent"
    }, requestId);

  } catch (error) {
    logError("Password reset request error", error, requestId);
    return respondError("An unexpected error occurred", 500, requestId);
  }
}

/**
 * Handle password reset confirmation
 */
export async function handlePasswordResetConfirm(
  body: any,
  requestId: string
): Promise<Response> {
  const { token, newPassword } = body;

  logInfo("Password reset confirmation", { requestId });

  if (!token || !newPassword) {
    return respondError("Token and new password are required", 400, requestId);
  }

  if (newPassword.length < 8) {
    return respondError("Password must be at least 8 characters", 400, requestId);
  }

  try {
    // Find valid token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !resetToken) {
      logError("Invalid or expired token", tokenError, requestId);
      return respondError("Invalid or expired reset token", 400, requestId);
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetToken.user_id,
      { password: newPassword }
    );

    if (updateError) {
      logError("Error updating password", updateError, requestId);
      return respondError("Unable to update password", 500, requestId);
    }

    // Mark token as used
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: resetToken.user_id,
      action: "password_reset_completed",
      details: {}
    });

    logInfo("Password reset completed", { requestId, userId: resetToken.user_id });

    return respondSuccess({ 
      message: "Password has been reset successfully. You can now log in with your new password."
    }, requestId);

  } catch (error) {
    logError("Password reset confirmation error", error, requestId);
    return respondError("An unexpected error occurred", 500, requestId);
  }
}
