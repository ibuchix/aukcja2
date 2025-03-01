
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

    // Try direct Supabase auth signup first
    try {
      const { data: existingUser, error: existingUserError } = await supabase.auth.admin
        .getUserByEmail(normalizedEmail);

      // If user exists, return error
      if (existingUser) {
        return {
          success: false,
          error: "An account with this email already exists. Please login instead."
        };
      }

      // Try direct signup with Supabase
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: safeTrim(metadata.name),
            role: 'dealer'
          }
        }
      });

      if (signupError) {
        console.error("Direct Supabase signup error:", signupError);
        
        // Try the edge function as fallback
        const response = await invokeDealerFunction<RegisterResponse>(
          'register', 
          {
            email: normalizedEmail,
            password,
            supervisorName: safeTrim(metadata.name),
            companyName: safeTrim(metadata.companyName),
            phoneNumber: safeTrim(metadata.phoneNumber),
            taxId: safeTrim(metadata.taxId),
            businessRegistryNumber: safeTrim(metadata.businessRegistryNumber),
            companyAddress: safeTrim(metadata.companyAddress)
          }
        );

        if (!response.success) {
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

        console.log("Registration successful via edge function! User ID:", userId);
        return {
          success: true,
          userId
        };
      }

      // Direct registration was successful
      if (!authData.user) {
        return {
          success: false,
          error: "Registration failed - no user returned"
        };
      }

      // Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: safeTrim(metadata.name),
          dealership_name: safeTrim(metadata.companyName) || '',
          tax_id: safeTrim(metadata.taxId) || '',
          business_registry_number: safeTrim(metadata.businessRegistryNumber) || '',
          license_number: safeTrim(metadata.businessRegistryNumber) || '',
          address: safeTrim(metadata.companyAddress) || '',
          verification_status: 'pending',
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dealerError) {
        console.error("Error creating dealer profile:", dealerError);
        return {
          success: false,
          error: `Failed to create dealer profile: ${dealerError.message}`
        };
      }

      console.log("Registration successful via direct Supabase auth! User ID:", authData.user.id);
      return {
        success: true,
        userId: authData.user.id
      };
    } catch (error) {
      console.error("Error in direct Supabase auth:", error);
      
      // Continue with edge function approach as fallback
      const response = await invokeDealerFunction<RegisterResponse>(
        'register', 
        {
          email: normalizedEmail,
          password,
          supervisorName: safeTrim(metadata.name),
          companyName: safeTrim(metadata.companyName),
          phoneNumber: safeTrim(metadata.phoneNumber),
          taxId: safeTrim(metadata.taxId),
          businessRegistryNumber: safeTrim(metadata.businessRegistryNumber),
          companyAddress: safeTrim(metadata.companyAddress)
        }
      );

      if (!response.success) {
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

      console.log("Registration successful! User ID:", userId);
      return {
        success: true,
        userId
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
