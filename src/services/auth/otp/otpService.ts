
import { supabase } from "@/integrations/supabase/client";
import { SignInResult } from "../models";
import { validateEmail, safeTrim, checkAccountExists } from "../validation";

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
      }
    });
    
    if (error) {
      console.error("Error invoking dealer-otp function:", error);
      
      // Enhanced CORS error detection
      if (error.message?.includes("Failed to send a request") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("Access-Control-Allow") ||
          error.message?.includes("CORS")) {
        return {
          success: false,
          error: "Network error. Please check your connection and try again."
        };
      }
      
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
    
    // Enhanced CORS error detection
    if (error instanceof Error && 
        (error.message.includes("CORS") || 
         error.message.includes("Failed to fetch") ||
         error.message.includes("NetworkError") ||
         error.message.includes("Failed to send a request") ||
         error.message.includes("Access-Control-Allow"))) {
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
