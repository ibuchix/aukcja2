
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

    try {
      // Call the RPC function directly to create dealer profile
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_dealer_with_profile', {
        p_email: normalizedEmail,
        p_password: password,
        p_supervisor_name: safeTrim(metadata.name),
        p_company_name: safeTrim(metadata.companyName || ''),
        p_tax_id: safeTrim(metadata.taxId || ''),
        p_business_registry_number: safeTrim(metadata.businessRegistryNumber || ''),
        p_address: safeTrim(metadata.companyAddress || '')
      });

      console.log("Direct RPC result:", rpcResult, "Error:", rpcError);

      if (rpcError) {
        if (rpcError.message?.includes("already exists")) {
          return {
            success: false,
            error: "An account with this email already exists. Please login instead."
          };
        }
        
        return {
          success: false,
          error: rpcError.message || "Registration failed"
        };
      }
      
      if (rpcResult && typeof rpcResult === 'object') {
        if (!rpcResult.success) {
          return {
            success: false,
            error: rpcResult.error || "Registration failed with database error"
          };
        }
        
        // Registration successful
        console.log("Registration successful via direct RPC call:", rpcResult);
        
        // Call the send-welcome-email edge function
        try {
          const welcomeResponse = await supabase.functions.invoke('send-dealer-welcome', {
            body: {
              email: normalizedEmail,
              name: safeTrim(metadata.name)
            }
          });
          console.log("Welcome email response:", welcomeResponse);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Do not fail registration if email fails
        }
        
        return {
          success: true,
          userId: rpcResult.user?.id,
          message: "Registration successful. Please check your email for verification."
        };
      }
      
      return {
        success: false,
        error: "Invalid response from registration service"
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
