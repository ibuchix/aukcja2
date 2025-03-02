
import { validateEmail, validatePassword, safeTrim, checkAccountExists } from "./validation";
import { 
  SignUpResult, 
  UserMetadata
} from "./models";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles the signup process for dealers with email authentication
 */
export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    console.log("Starting dealer signup process...");

    // Use centralized email validation with better error handling
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }

    // Use centralized password validation with better error handling
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.error };
    }

    // Validate required metadata with better handling
    if (!safeTrim(metadata.name)) {
      return { success: false, error: "Name is required" };
    }

    try {
      console.log("Calling dealer-auth function with register action");
      
      // Call the dealer-auth edge function to handle registration
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'register',
          email: safeTrim(email).toLowerCase(),
          password: password,
          metadata: {
            name: safeTrim(metadata.name),
            companyName: safeTrim(metadata.companyName || ''),
            taxId: safeTrim(metadata.taxId || ''),
            businessRegistryNumber: safeTrim(metadata.businessRegistryNumber || ''),
            companyAddress: safeTrim(metadata.companyAddress || ''),
            phoneNumber: safeTrim(metadata.phoneNumber || '')
          },
          requestId: crypto.randomUUID(), // Add a unique request ID for tracking retries
          timestamp: new Date().toISOString()
        }
      });
      
      console.log("Edge function response:", data, "Error:", error);

      if (error) {
        // Enhanced error handling for network issues
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('NetworkError') ||
            error.message?.includes('network')) {
          console.error("Network error communicating with registration service:", error);
          return {
            success: false,
            error: "Network error connecting to registration service. Please try again.",
            errorType: 'network'
          };
        }
      
        return {
          success: false,
          error: error.message || "Registration failed with server error"
        };
      }
      
      if (!data) {
        console.error("Empty response from registration service");
        return {
          success: false,
          error: "No response from registration service"
        };
      }
      
      // Parse the response
      const response = data as any;
      
      if (!response.success) {
        console.error("Registration failed with error:", response.error);
        return {
          success: false,
          error: response.error || "Registration failed with an unknown error"
        };
      }

      // Check for partial success in the response (new feature)
      if (response.warning) {
        console.warn("Partial success detected:", response.warning);
        return {
          success: true,
          partialSuccess: true,
          warning: response.warning,
          userId: response.user?.id || response.userId,
          needsProfileCreation: true,
          message: "Account created with some limitations"
        };
      }

      // Robust user ID extraction with detailed logging
      const userId = response.user?.id || response.userId;
      console.log("Registration successful, extracted userId:", userId);
      
      if (!userId) {
        console.warn("User ID is missing from the registration response:", response);
      }

      // Registration successful
      return {
        success: true,
        userId: userId,
        message: response.message || "Registration successful. Please check your email for verification."
      };
    } catch (error) {
      console.error("Error in registration process:", error);
      
      // Enhanced error type detection
      let errorType: 'auth' | 'database' | 'validation' | 'network' | 'unknown' = 'unknown';
      let errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      if (errorMessage.includes('network') || 
          errorMessage.includes('fetch') || 
          errorMessage.includes('connection')) {
        errorType = 'network';
        errorMessage = "Network error connecting to registration service. Please try again.";
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType: errorType as any
      };
    }
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during signup"
    };
  }
};
