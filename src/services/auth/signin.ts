
import { validateEmail, safeTrim } from "./validation";
import { SignInResult, LoginResponse } from "./models";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles the sign-in process for dealers with email authentication
 */
export const signInDealerWithEmail = async (
  email: string,
  password: string
): Promise<SignInResult> => {
  // Validate email format first
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error };
  }

  // Normalize email
  const normalizedEmail = safeTrim(email).toLowerCase();

  try {
    console.log("Starting dealer login with native Supabase auth");
    
    // Step 1: Use Supabase's native auth for sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (authError) {
      console.error("Login auth error:", authError);
      return {
        success: false,
        error: authError.message || "Login failed. Please check your credentials."
      };
    }

    if (!authData.session) {
      return {
        success: false,
        error: "Authentication successful but no session was created"
      };
    }

    // Step 2: After authentication, fetch dealer profile data
    const { data: dealer, error: profileError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.warn("Profile fetch error (non-fatal):", profileError);
      // Still return success if auth worked but profile fetch failed
      // The user can still log in but might have limited functionality
      return {
        success: true,
        session: authData.session,
        dealer: null,
        partialSuccess: true,
        warning: "Your account was authenticated, but we couldn't fetch your dealer profile."
      };
    }

    console.log("Login successful with profile fetch!");
    return {
      success: true,
      session: authData.session,
      dealer
    };
  } catch (error) {
    console.error("Unexpected login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during login"
    };
  }
};
