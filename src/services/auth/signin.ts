
import { supabase } from "@/integrations/supabase/client";
import { SignInResult } from "./models";
import { validateEmail, safeTrim, checkAccountExists } from "./validation";

/**
 * Initiates an OTP sign-in flow using our custom edge function
 */
export const initiateOtpSignIn = async (email: string): Promise<SignInResult> => {
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
    
    // First, check if the user account exists
    console.log("Checking if account exists before OTP signin:", normalizedEmail);
    const accountExists = await checkAccountExists(normalizedEmail);
    
    if (!accountExists) {
      console.log("User does not exist:", normalizedEmail);
      return {
        success: false,
        error: "No account found with this email. Please register first."
      };
    }
    
    console.log("Account exists, proceeding with OTP signin for:", normalizedEmail);
    
    // Use the dealer-otp edge function to generate and send OTP
    const { data, error } = await supabase.functions.invoke('dealer-otp', {
      body: {
        action: 'generate',
        email: normalizedEmail
      }
    });
    
    if (error) {
      console.error("Error invoking dealer-otp function:", error);
      return { 
        success: false, 
        error: error.message || "Failed to send login code" 
      };
    }
    
    if (!data.success) {
      console.error("dealer-otp function returned error:", data.error);
      
      // Handle common errors with user-friendly messages
      if (data.error && data.error.includes("Too many requests")) {
        return { 
          success: false, 
          error: "Too many login attempts. Please try again in a few minutes."
        };
      }
      
      return { 
        success: false, 
        error: data.error || "Failed to send login code"
      };
    }
    
    return {
      success: true,
      message: data.message || "Login code sent successfully" 
    };
  } catch (error) {
    console.error("Exception in initiateOtpSignIn:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};

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
    
    // If verification is successful, set the returned session in Supabase client
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
    } else {
      console.error("Missing session data from verification");
      return {
        success: false,
        error: "Failed to establish session - missing data"
      };
    }
    
    return {
      success: true,
      message: "Login successful",
      session: data.session,
      dealer: data.dealer
    };
  } catch (error) {
    console.error("Exception in verifyOtp:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};
