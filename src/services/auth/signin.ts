
import { supabase } from "@/integrations/supabase/client";
import { SignInResult } from "./models";
import { validateEmail, safeTrim } from "./validation";

/**
 * Initiates an OTP sign-in flow for dealers using our custom implementation
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
    
    // Call our custom dealer-otp edge function
    const { data, error } = await supabase.functions.invoke('dealer-otp', {
      body: {
        action: 'generate',
        email: normalizedEmail
      }
    });
    
    if (error) {
      console.error("Error initiating OTP signin:", error);
      return { 
        success: false, 
        error: error.message || "Failed to initiate login"
      };
    }
    
    if (!data || !data.success) {
      console.error("OTP generation failed:", data?.error || "Unknown error");
      return { 
        success: false, 
        error: data?.error || "Failed to send login code"
      };
    }
    
    return {
      success: true,
      message: "Login code sent successfully" 
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
 * Verifies the OTP code and creates a session if valid
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
    
    // Call our custom dealer-otp edge function
    const { data, error } = await supabase.functions.invoke('dealer-otp', {
      body: {
        action: 'verify',
        email: normalizedEmail,
        otp
      }
    });
    
    if (error) {
      console.error("Error verifying OTP:", error);
      return { 
        success: false, 
        error: error.message || "Failed to verify code"
      };
    }
    
    if (!data || !data.success) {
      console.error("OTP verification failed:", data?.error || "Unknown error");
      return { 
        success: false, 
        error: data?.error || "Invalid or expired verification code"
      };
    }
    
    // Set the session in Supabase auth client locally
    if (data.session) {
      const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      
      if (setSessionError) {
        console.error("Error setting session:", setSessionError);
        return { 
          success: false, 
          error: "Failed to initialize session"
        };
      }
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
