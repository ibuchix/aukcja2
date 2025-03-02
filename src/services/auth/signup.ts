
import { validateEmail, validatePassword, safeTrim, checkAccountExists } from "./validation";
import { invokeDealerFunction } from "../api/dealerApiClient";
import { 
  SignUpResult, 
  UserMetadata, 
  RegisterResponse,
  isRegisterResponse
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

    // Normalize inputs
    const normalizedEmail = safeTrim(email).toLowerCase();

    // Check if email already exists
    const emailExists = await checkAccountExists(normalizedEmail);
    if (emailExists) {
      return {
        success: false,
        error: "An account with this email already exists. Please login instead."
      };
    }

    // Try direct signup with Supabase using transaction for atomic operations
    try {
      // Use edge function with locking mechanism to prevent race conditions
      const response = await invokeDealerFunction<RegisterResponse>(
        'register-with-lock', 
        {
          email: normalizedEmail,
          password,
          supervisorName: safeTrim(metadata.name),
          // FIX: This is the key issue - we need to match the exact field names expected by the edge function
          companyName: safeTrim(metadata.companyName),           // Changed from dealershipName to companyName
          phoneNumber: safeTrim(metadata.phoneNumber),
          taxId: safeTrim(metadata.taxId),
          businessRegistryNumber: safeTrim(metadata.businessRegistryNumber),
          companyAddress: safeTrim(metadata.companyAddress)
        }
      );

      if (!response.success) {
        // Check for concurrent registration error
        if (response.error?.includes("registration in progress") || response.error?.includes("concurrent")) {
          console.warn("Concurrent registration detected:", response.error);
          return {
            success: false,
            error: "Another registration with this email is already in progress. Please try again in a moment."
          };
        }
        
        // Handle specific error messages from edge function
        return {
          success: false,
          error: response.error || "Registration failed. Please try again."
        };
      }

      if (!isRegisterResponse(response.data)) {
        console.error("Invalid registration response format:", response.data);
        return {
          success: false,
          error: "Registration failed - invalid response format from server"
        };
      }

      const userId = response.data?.user?.id;
      if (!userId) {
        console.error("No user ID in response:", response.data);
        return {
          success: false,
          error: "Registration failed - missing user ID in response"
        };
      }

      console.log("Registration successful via edge function with locking! User ID:", userId);
      return {
        success: true,
        userId
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
