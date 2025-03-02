
import { validateEmail, safeTrim } from "./validation";
import { SignInResult, LoginResponse, isLoginResponse } from "./models";
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
    console.log("Calling dealer-auth function with login action");
    
    // Use the edge function for login
    const { data, error } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'login',
        email: normalizedEmail,
        password
      }
    });

    if (error) {
      console.error("Login function error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please check your credentials."
      };
    }

    if (!data) {
      return {
        success: false,
        error: "No response from authentication service"
      };
    }

    console.log("Login data structure:", JSON.stringify(data, null, 2));

    // Use type guard to validate login response
    if (!isLoginResponse(data)) {
      console.error("Invalid login response format:", data);
      return {
        success: false,
        error: "Login failed - invalid response format from server"
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Login failed with unknown error"
      };
    }

    console.log("Login successful via edge function!");
    return {
      success: true,
      session: data.session,
      dealer: data.dealer
    };
  } catch (error) {
    console.error("Unexpected login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during login"
    };
  }
};
