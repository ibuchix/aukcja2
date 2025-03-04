
import { validateEmail, safeTrim } from "./validation";
import { SignInResult, LoginResponse } from "./models";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { Session, User } from '@supabase/supabase-js';
import { Database } from "@/integrations/supabase/types";

// Define the type for the specific RPC response to match what the authenticate_dealer function returns
interface AuthenticateDealerResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  dealer?: any;
}

/**
 * Handles the sign-in process for dealers with email authentication
 * Uses a dedicated SQL function that safely verifies credentials
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
    console.log("Starting dealer login process with email:", normalizedEmail);
    
    // First, try direct login which is the simplest approach
    const { data: directSignIn, error: directSignInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });
    
    if (!directSignInError && directSignIn.session) {
      console.log("Direct login successful, returning session");
      return {
        success: true,
        session: directSignIn.session
      };
    }
    
    console.log("Direct login failed, falling back to RPC authentication");
    
    // If direct login fails, use the specialized function that handles custom registration
    const { data: authResult, error: authError } = await supabase.rpc(
      'authenticate_dealer',
      { 
        p_email: normalizedEmail,
        p_password: password
      }
    );
    
    if (authError) {
      console.error("DB auth function error:", authError);
      
      // Provide user-friendly error messages
      if (authError.message.includes('Invalid credentials')) {
        return {
          success: false,
          error: "Invalid email or password. Please check your credentials."
        };
      }
      
      throw authError;
    }
    
    // Safe type conversion with proper type checking
    if (!authResult || typeof authResult !== 'object') {
      console.warn("Authentication failed: Invalid response format");
      return {
        success: false,
        error: "Authentication failed due to server error. Please try again."
      };
    }
    
    // Check if response has the expected structure
    const typedResult = authResult as unknown as AuthenticateDealerResponse;
    
    if (!typedResult.success) {
      console.warn("Authentication failed:", typedResult.error || "Unknown error");
      return {
        success: false,
        error: typedResult.error || "Authentication failed. Please check your credentials."
      };
    }
    
    console.log("Authentication successful, creating session for user ID:", typedResult.user_id);
    
    if (!typedResult.user_id) {
      console.error("Authentication succeeded but no user_id was returned");
      return {
        success: false,
        error: "Authentication successful but user identification failed."
      };
    }
    
    // Try to sign in again now that we've verified credentials
    console.log("Attempting direct signin after credential verification");
    const { data: verifiedSignIn, error: verifiedSignInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });
    
    if (!verifiedSignInError && verifiedSignIn.session) {
      console.log("Post-verification direct login successful");
      return {
        success: true,
        session: verifiedSignIn.session,
        dealer: typedResult.dealer
      };
    }
    
    // If direct login still fails, try OTP method
    console.log("Direct login still failed, trying OTP method");
    return {
      success: true,
      requiresOtp: true, 
      userId: typedResult.user_id,
      email: normalizedEmail,
      dealer: typedResult.dealer
    };
    
  } catch (error) {
    console.error("Login error:", error);
    
    // Provide user-friendly error messages based on the error type
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login";
    
    // Check for specific error messages and provide clearer feedback
    if (errorMessage.toLowerCase().includes('invalid login')) {
      return {
        success: false,
        error: "Invalid email or password. Please check your credentials."
      };
    }
    
    if (errorMessage.toLowerCase().includes('too many requests')) {
      return {
        success: false,
        error: "Too many login attempts. Please try again later."
      };
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Initiates an OTP sign-in flow for dealers
 */
export const initiateOtpSignIn = async (email: string): Promise<SignInResult> => {
  try {
    console.log("Initiating OTP signin for email:", email);
    
    // Request OTP to be sent to user's email
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // OTP valid for 5 minutes
        emailRedirectTo: window.location.origin + '/auth'
      }
    });
    
    if (error) {
      console.error("Error initiating OTP signin:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log("OTP signin initiated successfully");
    return {
      success: true,
      message: "A one-time password has been sent to your email"
    };
  } catch (error) {
    console.error("Error in OTP initiation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send OTP"
    };
  }
};

/**
 * Verifies an OTP for dealer sign-in
 */
export const verifyOtp = async (email: string, otp: string): Promise<SignInResult> => {
  try {
    console.log("Verifying OTP for email:", email);
    
    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'email'
    });
    
    if (error) {
      console.error("OTP verification error:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    if (!data.session) {
      console.error("OTP verification succeeded but no session was returned");
      return {
        success: false,
        error: "Authentication successful but session creation failed."
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
      error: error instanceof Error ? error.message : "Failed to verify OTP"
    };
  }
};
