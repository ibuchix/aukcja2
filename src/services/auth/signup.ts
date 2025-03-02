
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
          }
        }
      });
      
      console.log("Edge function response:", data, "Error:", error);

      if (error) {
        return {
          success: false,
          error: error.message || "Registration failed with server error"
        };
      }
      
      if (!data) {
        return {
          success: false,
          error: "No response from registration service"
        };
      }
      
      // Parse the response
      const response = data as any;
      
      if (!response.success) {
        return {
          success: false,
          error: response.error || "Registration failed with an unknown error"
        };
      }

      // Improved user ID extraction with better logging and fallbacks
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
      
      return {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : "An unexpected error occurred during registration. Please try again."
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
