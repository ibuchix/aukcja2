
import { supabase } from "@/integrations/supabase/client";
import { SignInResult } from "./models";
import { validateEmail, safeTrim, checkAccountExists } from "./validation";

/**
 * Initiates an OTP sign-in flow for dealers using Supabase's built-in OTP functionality
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
    const accountExists = await checkAccountExists(normalizedEmail);
    if (!accountExists) {
      console.log("User does not exist:", normalizedEmail);
      return {
        success: false,
        error: "No account found with this email. Please register first."
      };
    }
    
    // Use Supabase's built-in OTP functionality with explicit options
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false, // This is key - don't try to create user during sign-in
        emailRedirectTo: window.location.origin + '/auth?tab=login',
      }
    });
    
    if (error) {
      console.error("Error initiating OTP signin:", error);
      return { 
        success: false, 
        error: error.message || "Failed to initiate login"
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
 * Verifies the OTP code using Supabase's built-in OTP verification
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
    
    // Use Supabase's built-in OTP verification
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp,
      type: 'email'
    });
    
    if (error) {
      console.error("Error verifying OTP:", error);
      return { 
        success: false, 
        error: error.message || "Failed to verify code"
      };
    }
    
    // If verification is successful, data will contain session and user
    if (!data.session) {
      console.error("Session data missing after OTP verification");
      return {
        success: false,
        error: "Failed to establish session"
      };
    }
    
    // Get dealer profile information if available
    let dealerProfile = null;
    try {
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
        
      dealerProfile = dealerData;
    } catch (profileError) {
      console.warn("Could not fetch dealer profile:", profileError);
      // Continue anyway, just won't have profile data
    }
    
    return {
      success: true,
      message: "Login successful",
      session: data.session,
      dealer: dealerProfile
    };
  } catch (error) {
    console.error("Exception in verifyOtp:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};
