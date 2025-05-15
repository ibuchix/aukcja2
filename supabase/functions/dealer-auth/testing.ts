
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { preparePassword } from "./password-utils.ts";
import { logInfo, logDebug, logError } from "./logging.ts";

// Initialize the Supabase client with service role
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

/**
 * Test authentication for a specific user
 * Only for diagnostics/debugging!
 */
export async function testAuthenticationForUser(email: string, plainPassword: string): Promise<any> {
  try {
    logInfo(`Testing authentication for email: ${email}`);
    
    // Get user by email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, encrypted_password')
      .eq('email', email)
      .single();
    
    if (userError) {
      logError("Error fetching user:", userError);
      return { success: false, error: userError.message };
    }
    
    if (!userData) {
      return { success: false, error: "User not found" };
    }
    
    logDebug("Found user", { id: userData.id, email: userData.email });
    
    // Normalize password as we would in the main functions
    const normalizedPassword = preparePassword(plainPassword);
    
    // Verify password using RPC function
    const { data: verificationData, error: verificationError } = await supabaseAdmin.rpc(
      "verify_password", 
      {
        uuid: userData.id,
        plain_text: normalizedPassword
      }
    );
    
    if (verificationError) {
      logError("Password verification error:", verificationError);
      return { success: false, error: verificationError.message };
    }
    
    // Return detailed info for diagnostic purposes
    return {
      success: true,
      verificationResult: verificationData,
      passwordDetails: {
        originalLength: plainPassword.length,
        normalizedLength: normalizedPassword.length,
        firstCharCode: normalizedPassword.charCodeAt(0),
        lastCharCode: normalizedPassword.charCodeAt(normalizedPassword.length - 1),
      },
      userDetails: {
        id: userData.id,
        email: userData.email,
        hashedPasswordStart: (userData.encrypted_password || "").substring(0, 10) + "...",
      }
    };
  } catch (error) {
    logError("Test authentication error:", error);
    return { success: false, error: error.message };
  }
}
