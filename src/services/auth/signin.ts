
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
    
    // Use the specialized login function that handles custom registration
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
    
    console.log("Authentication successful, creating session");
    
    // Instead of using signInWithPassword, use our edge function to create a session
    // This bypasses the password verification that was causing issues
    if (!typedResult.user_id) {
      console.error("Authentication succeeded but no user_id was returned");
      return {
        success: false,
        error: "Authentication successful but user identification failed."
      };
    }
    
    // Call our secure edge function to create a session
    const { data: sessionResponse, error: functionError } = await supabase.functions.invoke(
      'create-dealer-session',
      {
        body: { userId: typedResult.user_id }
      }
    );
    
    if (functionError) {
      console.error("Session creation error:", functionError);
      
      // Even though authentication succeeded, session creation failed
      // This is a partial success case
      return {
        success: true,
        partialSuccess: true,
        warning: "Your credentials were verified, but we couldn't create a session. Please try again.",
        dealer: typedResult.dealer
      };
    }
    
    if (!sessionResponse.success || !sessionResponse.session) {
      console.error("No session created despite successful auth:", sessionResponse);
      return {
        success: false,
        error: "Authentication succeeded but session creation failed."
      };
    }
    
    // Store the session in the Supabase client
    const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
      access_token: sessionResponse.session.access_token,
      refresh_token: sessionResponse.session.refresh_token
    });
    
    if (setSessionError) {
      console.error("Error setting session:", setSessionError);
      return {
        success: false,
        error: "Authentication succeeded but there was an error setting your session."
      };
    }
    
    // Return the complete successful result
    console.log("Login fully successful with session and dealer profile");
    return {
      success: true,
      session: sessionResponse.session,
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
