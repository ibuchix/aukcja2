
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
    console.log("User exists, sending OTP for email signin");
    
    // Use email sign-in that doesn't attempt to create a new user
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        // For email OTP, don't set shouldCreateUser at all - let Supabase use its default behavior
        // for existing users which is to send an OTP without trying to create a user
        emailRedirectTo: window.location.origin + '/auth'
      }
    });
    
    if (error) {
      // Enhanced error logging
      console.error("Error initiating OTP signin:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
        details: JSON.stringify(error)
      });
      
      // Provide more detailed error messages for debugging purposes
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: "Too many requests. Please try again in a few minutes."
        };
      }
      
      // Handle general errors
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
    // Enhanced error logging for unexpected errors
    console.error("Unexpected error in OTP initiation:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
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
