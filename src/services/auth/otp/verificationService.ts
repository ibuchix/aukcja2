
import { supabase } from "@/integrations/supabase/client";
import { SignInResult } from "../models";
import { validateEmail, safeTrim } from "../validation";

/**
 * Verifies the OTP code using our custom edge function
 */
export const verifyOtp = async (email: string, otp: string): Promise<SignInResult> => {
  try {
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { 
        success: false, 
        error: emailValidation.error || "Invalid email format" 
      };
    }
    
    const normalizedEmail = safeTrim(email).toLowerCase();
    
    // Use the dealer-otp edge function to verify OTP and create session
    const { data, error } = await supabase.functions.invoke('dealer-otp', {
      body: {
        action: 'verify',
        email: normalizedEmail,
        otp: otp
      }
    });
    
    if (error) {
      console.error("Error invoking dealer-otp function for verification:", error);
      return { 
        success: false, 
        error: error.message || "Failed to verify code"
      };
    }
    
    if (!data.success) {
      console.error("dealer-otp verification returned error:", data.error);
      return { 
        success: false, 
        error: data.error || "Failed to verify code"
      };
    }
    
    // Return the exchange token from the verification response
    if (data.exchangeToken) {
      console.log("Received exchange token from verification");
      return {
        success: true,
        message: "Login verification successful",
        exchangeToken: data.exchangeToken,
        user: data.user,
        dealer: data.dealer
      };
    }
    
    // Fallback for if no exchange token is present (backwards compatibility)
    if (data.session) {
      // Set session in Supabase client 
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      
      if (sessionError) {
        console.error("Error setting session:", sessionError);
        return {
          success: false,
          error: "Failed to establish session"
        };
      }
      
      return {
        success: true,
        message: "Login successful",
        session: data.session,
        dealer: data.dealer
      };
    }
    
    // If neither exchange token nor session is present
    console.error("Missing session data and exchange token from verification");
    return {
      success: false,
      error: "Failed to establish session - missing data"
    };
  } catch (error) {
    console.error("Exception in verifyOtp:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};
