
import { validateEmail, safeTrim } from "./validation";
import { invokeDealerFunction } from "../api/dealerApiClient";
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
    // First try direct Supabase auth to avoid edge function complexity
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (authError) {
      console.error("Direct Supabase login error:", authError);
      
      // Try the edge function as fallback
      const response = await invokeDealerFunction<LoginResponse>(
        'login', 
        {
          email: normalizedEmail,
          password
        }
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || "Login failed. Please check your credentials."
        };
      }

      // Validate response data from edge function
      if (!response.data) {
        return {
          success: false,
          error: "Login successful but no session data returned"
        };
      }

      console.log("Login data structure (edge function):", JSON.stringify(response.data, null, 2));

      // Use type guard to validate login response
      if (!isLoginResponse(response.data)) {
        console.error("Invalid login response format:", response.data);
        return {
          success: false,
          error: "Login failed - invalid response format from server"
        };
      }

      console.log("Login successful via edge function!");
      return {
        success: true,
        session: response.data.session,
        dealer: response.data.dealer
      };
    }

    // Direct Supabase auth was successful
    console.log("Login successful via direct Supabase auth!");
    
    // Verify password using the RPC function
    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_password', {
      uuid: authData.user.id,
      plain_text: password
    });

    if (verifyError || !verifyData) {
      console.error("Password verification failed:", verifyError);
      // Sign out the user since verification failed
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Credential verification failed. Please try again."
      };
    }
    
    // Get dealer profile for the user
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (dealerError) {
      console.error("Error fetching dealer profile:", dealerError);
    }

    return {
      success: true,
      session: authData.session,
      dealer: dealerData || null
    };
  } catch (error) {
    console.error("Unexpected login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during login"
    };
  }
};
