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
    
    // First, check if the user account exists with improved resilience
    console.log("Checking if account exists before OTP signin:", normalizedEmail);
    let accountChecked = false;
    
    try {
      const accountExists = await checkAccountExists(normalizedEmail);
      accountChecked = true;
      
      if (!accountExists) {
        console.log("User does not exist:", normalizedEmail);
        return {
          success: false,
          error: "No account found with this email. Please register first."
        };
      }
    } catch (checkError) {
      console.error("Error checking if account exists:", checkError);
      // Silently continue even if the check fails - we'll let the OTP generation determine if the account exists
      // This prevents locking users out due to permission errors
    }
    
    console.log("Account exists or check failed, proceeding with OTP signin for:", normalizedEmail);
    
    // Use the dealer-otp edge function to generate and send OTP
    const { data, error } = await supabase.functions.invoke('dealer-otp', {
      method: 'POST',
      body: {
        action: 'generate',
        email: normalizedEmail
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (error) {
      console.error("Error invoking dealer-otp function:", error);
      
      // If we couldn't determine if the account exists earlier AND we got an error
      // that might indicate the user doesn't exist
      if (!accountChecked && 
          (error.message?.includes("not found") || 
           error.message?.includes("doesn't exist") ||
           error.message?.includes("Invalid email"))) {
        return { 
          success: false, 
          error: "No account found with this email. Please register first." 
        };
      }
      
      return { 
        success: false, 
        error: error.message || "Failed to send login code" 
      };
    }
    
    if (!data?.success) {
      console.error("dealer-otp function returned error:", data?.error);
      
      // Handle common errors with user-friendly messages
      if (data?.error) {
        // If the error indicates the user doesn't exist
        if (data.error.includes("not found") || 
            data.error.includes("doesn't exist") ||
            data.error.includes("Invalid email")) {
          return { 
            success: false, 
            error: "No account found with this email. Please register first."
          };
        }
        
        if (data.error.includes("Too many requests")) {
          return { 
            success: false, 
            error: "Too many login attempts. Please try again in a few minutes."
          };
        }
      }
      
      return { 
        success: false, 
        error: data?.error || "Failed to send login code"
      };
    }
    
    return {
      success: true,
      message: data.message || "Login code sent successfully" 
    };
  } catch (error) {
    console.error("Exception in initiateOtpSignIn:", error);
    
    // Check if this is a CORS-related error
    if (error instanceof Error && 
        (error.message.includes("CORS") || 
         error.message.includes("Failed to fetch") ||
         error.message.includes("NetworkError") ||
         error.message.includes("Failed to send a request"))) {
      return {
        success: false,
        error: "Network error: Unable to connect to the server. Please try again later."
      };
    }
    
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
