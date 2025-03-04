import { validateEmail, safeTrim } from "./validation";
import { SignInResult } from "./models";
import { supabase } from "@/integrations/supabase/client";
import { checkAccountExists } from "./validation";

/**
 * Initiates a Magic Link sign-in flow for dealers
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
    console.log("Initiating Magic Link signin for email:", normalizedEmail);
    
    // First check if user exists in database
    const userExists = await checkAccountExists(normalizedEmail);
    
    if (!userExists) {
      console.log("User does not exist, cannot send Magic Link for login");
      return {
        success: false,
        error: "No account found with this email. Please register first."
      };
    }
    
    // User exists, proceed with Magic Link
    console.log("User exists, sending Magic Link for email signin");
    
    // Use Magic Link sign-in with explicitly set parameters
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        // Explicitly set shouldCreateUser to false to prevent the database error
        shouldCreateUser: false,
        // Use the current URL as redirect to ensure it matches site URL config
        emailRedirectTo: window.location.origin + '/auth',
        // Explicitly set to use Magic Link instead of OTP
        shouldCreateUser: false
      }
    });
    
    if (error) {
      // Enhanced error logging
      console.error("Error initiating Magic Link signin:", error);
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
    
    console.log("Magic Link signin initiated successfully");
    return {
      success: true,
      message: "A secure login link has been sent to your email"
    };
  } catch (error) {
    // Enhanced error logging for unexpected errors
    console.error("Unexpected error in Magic Link initiation:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send login link"
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
