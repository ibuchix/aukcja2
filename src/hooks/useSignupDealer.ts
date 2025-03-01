
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/auth/signup";
import { createDealerProfile } from "@/services/dealerProfileService";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation' | 'network';
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkRetries, setNetworkRetries] = useState(0);

  const signupDealer = async (values: DealerFormValues): Promise<SignupResult> => {
    if (isSubmitting) {
      return { 
        success: false, 
        error: "Registration in progress",
        errorType: 'validation'
      };
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting dealer registration process");
      
      // Create user account without role in metadata since it's handled by DB trigger
      const signUpResult = await signUpDealerWithEmail(
        values.email.trim().toLowerCase(),
        values.password,
        {
          name: values.supervisorName.trim()
        }
      );

      if (!signUpResult.success) {
        // Check if the error is network-related
        if (signUpResult.error?.includes('network') || 
            signUpResult.error?.includes('timeout') || 
            signUpResult.error?.includes('unavailable') ||
            signUpResult.error?.includes('CORS') ||
            signUpResult.error?.includes('503')) {
          return {
            success: false,
            error: "Network error connecting to authentication service. Please try again.",
            errorType: 'network'
          };
        }

        return {
          success: false,
          error: signUpResult.error || "Failed to create user account",
          errorType: 'auth'
        };
      }

      if (!signUpResult.userId) {
        return {
          success: false,
          error: "User account created but user ID was not returned",
          errorType: 'auth'
        };
      }

      // Create dealer profile
      const profileResult = await createDealerProfile(signUpResult.userId, values);

      if (!profileResult.success) {
        // Enhanced network error detection
        if (profileResult.errorType === 'network' || 
            profileResult.error?.includes('network') || 
            profileResult.error?.includes('timeout') || 
            profileResult.error?.includes('unavailable')) {
          console.error("Network error during profile creation:", profileResult.error);
          return {
            success: false,
            error: "Network issue while creating dealer profile. Please try again.",
            errorType: 'network'
          };
        }

        return {
          success: false,
          error: profileResult.error,
          errorType: profileResult.errorType
        };
      }

      return { success: true };
      
    } catch (error) {
      console.error("Registration error:", error);
      
      // Check for network-related errors
      if (error instanceof Error) {
        if (error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.message.includes('timeout') || 
            error.message.includes('CORS') ||
            error.message.includes('503')) {
          console.log("Network error detected during registration");
          return {
            success: false,
            error: "Network connection issue. Please check your internet and try again.",
            errorType: 'network'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        errorType: 'validation'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}
