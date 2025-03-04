
import { validateEmail, safeTrim } from "./validation";
import { SignInResult } from "./models";
import { supabase } from "@/integrations/supabase/client";
import { checkAccountExists } from "./validation";

/**
 * Initiates an OTP sign-in flow for dealers
 */
export const initiateOtpSignIn = async (email: string): Promise<SignInResult> => {
  // Validate email format first
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error };
  }

  try {
    // Normalize email
    const normalizedEmail = safeTrim(email).toLowerCase();
    console.log("Initiating OTP signin for email:", normalizedEmail);
    
    // First check if user exists in database
    const userExists = await checkAccountExists(normalizedEmail);
    
    if (!userExists) {
      console.log("User does not exist, cannot send OTP for login");
      return {
        success: false,
        error: "No account found with this email. Please register first."
      };
    }
    
    // User exists, proceed with OTP
    console.log("User exists, sending OTP for signin");
    
    // For existing users, we want to prevent account creation
    // According to Supabase docs, this is the correct configuration for OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        // Specify email as the OTP delivery method
        emailRedirectTo: window.location.origin + '/auth'
      }
    });
    
    if (error) {
      console.error("Error initiating OTP signin:", error);
      
      // Provide more detailed error messages for debugging purposes
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: "Too many requests. Please try again in a few minutes."
        };
      }
      
      // Special handling for the "Signups not allowed" error
      if (error.message.includes('Signups not allowed')) {
        console.error("OTP signups not allowed. This might be a project configuration issue.");
        return {
          success: false,
          error: "OTP authentication is not properly configured. Please check your email templates in Supabase."
        };
      }

      return {
        success: false,
        error: error.message
      };
    }
    
    console.log("OTP signin initiated successfully");
    return {
      success: true,
      message: "A verification code has been sent to your email"
    };
  } catch (error) {
    console.error("Error in OTP initiation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send verification code"
    };
  }
};

/**
 * Verifies an OTP for dealer sign-in
 */
export const verifyOtp = async (email: string, otp: string): Promise<SignInResult> => {
  try {
    // Normalize email
    const normalizedEmail = safeTrim(email).toLowerCase();
    console.log("Verifying OTP for email:", normalizedEmail);
    
    // Verify the OTP - making sure to specify 'email' as the type
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp,
      type: 'email'
    });
    
    if (error) {
      console.error("OTP verification error:", error);
      
      // Provide user-friendly error messages based on the error type
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return {
          success: false,
          error: "Invalid or expired verification code. Please request a new one."
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
    
    if (!data.session) {
      console.error("OTP verification succeeded but no session was returned");
      return {
        success: false,
        error: "Authentication successful but session creation failed. Please try again."
      };
    }
    
    console.log("OTP verification successful, session created");
    return {
      success: true,
      session: data.session
    };
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify code"
    };
  }
};
