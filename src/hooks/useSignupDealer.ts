
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/auth/signup";
import { createDealerProfile } from "@/services/dealerProfileService";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation' | 'network';
  message?: string;
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
      
      // Create user account with ALL required metadata
      const signUpResult = await signUpDealerWithEmail(
        values.email.trim().toLowerCase(),
        values.password,
        {
          name: values.supervisorName.trim(),
          companyName: values.companyName.trim(),
          phoneNumber: values.phoneNumber.trim(),
          taxId: values.taxId.trim(),
          businessRegistryNumber: values.businessRegistryNumber.trim(),
          companyAddress: values.companyAddress.trim()
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

      // Skip profile creation if userId is missing - don't show error to user
      // The user account has been created already, and they can log in
      if (!signUpResult.userId) {
        console.warn("User ID not returned from registration, but auth account was created");
        return {
          success: true,
          message: "Your account has been created successfully. Please check your email for verification."
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

      return { success: true, message: signUpResult.message };
      
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
