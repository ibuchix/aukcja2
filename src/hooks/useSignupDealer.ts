import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/auth/signup";
import { createDealerProfile } from "@/services/dealer/dealerProfileCreationService";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation' | 'network';
  message?: string;
  userId?: string;
  partialSuccess?: boolean;
  warning?: string;
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkRetries, setNetworkRetries] = useState(0);
  const [authRetries, setAuthRetries] = useState(0);
  const MAX_RETRIES = 3;
  const MAX_AUTH_RETRIES = 2;

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
        // Check for unexpected auth failures which often require a retry
        if (signUpResult.error?.includes('unexpected_failure') || 
            signUpResult.error?.includes('500') || 
            signUpResult.error?.includes('AuthApiError')) {
          
          console.log(`Auth error detected, attempt ${authRetries + 1} of ${MAX_AUTH_RETRIES}`);
          
          // Only retry if we haven't exceeded our retry limit
          if (authRetries < MAX_AUTH_RETRIES) {
            setAuthRetries(prev => prev + 1);
            setIsSubmitting(false);
            
            // Add a small delay before retry - increasing with each retry
            const delayMs = Math.min(1000 * Math.pow(2, authRetries), 8000);
            console.log(`Retrying auth in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs)); 
            
            return signupDealer(values);
          }
          
          return {
            success: false,
            error: "Authentication service temporarily unavailable. Please try again in a few moments.",
            errorType: 'auth'
          };
        }
      
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

        // Look for common error patterns to provide better messages
        if (signUpResult.error?.includes('already exists')) {
          return {
            success: false,
            error: "An account with this email already exists. Please try logging in instead.",
            errorType: 'auth'
          };
        }

        return {
          success: false,
          error: signUpResult.error || "Failed to create user account",
          errorType: 'auth'
        };
      }

      // Check for partial success in the response (new feature)
      if (signUpResult.partialSuccess) {
        console.log("Partial success detected, user account created but additional steps needed");
        console.warn(signUpResult.warning);
        
        return {
          success: true,
          message: "Your account has been created, but some profile information will need to be completed later.",
          userId: signUpResult.userId,
          partialSuccess: true,
          warning: signUpResult.warning
        };
      }

      // Reset retries on success
      setAuthRetries(0);
      setNetworkRetries(0);

      // Skip profile creation if userId is missing - don't show error to user
      // The user account has been created already, and they can log in
      if (!signUpResult.userId) {
        console.warn("User ID not returned from registration, but auth account was created");
        return {
          success: true,
          message: "Your account has been created successfully. Please check your email for verification."
        };
      }

      // Create dealer profile only if not already created in the RPC call
      // This acts as a fallback in case the RPC call didn't handle profile creation
      if (signUpResult.needsProfileCreation) {
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
              errorType: 'network',
              userId: signUpResult.userId
            };
          }

          // We still created the user, so return partial success
          return {
            success: true,
            partialSuccess: true,
            warning: profileResult.error || "Profile creation had issues",
            message: "Your account has been created, but profile setup will need to be completed later.",
            userId: signUpResult.userId
          };
        }
      }

      return { 
        success: true, 
        message: signUpResult.message || "Registration successful. Please check your email for verification.",
        userId: signUpResult.userId 
      };
      
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
          
          // Only retry if we haven't exceeded our retry limit
          if (networkRetries < MAX_RETRIES) {
            setNetworkRetries(prev => prev + 1);
            setIsSubmitting(false);
            
            // Add a small delay before retry - increasing with each retry
            const delayMs = Math.min(1000 * Math.pow(2, networkRetries), 8000);
            console.log(`Retrying network in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs)); 
            
            return signupDealer(values);
          }
          
          return {
            success: false,
            error: "Network connection issue. Please check your internet and try again.",
            errorType: 'network'
          };
        }
        
        // Check for unexpected auth errors
        if (error.message.includes('unexpected_failure') || 
            error.message.includes('AuthApiError') || 
            error.message.includes('500')) {
          
          // Only retry if we haven't exceeded our retry limit
          if (authRetries < MAX_AUTH_RETRIES) {
            setAuthRetries(prev => prev + 1);
            setIsSubmitting(false);
            
            // Add a small delay before retry
            const delayMs = Math.min(1000 * Math.pow(2, authRetries), 8000);
            console.log(`Retrying auth error in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs)); 
            
            return signupDealer(values);
          }
          
          return {
            success: false,
            error: "Authentication service is temporarily unavailable. Please try again in a few moments.",
            errorType: 'auth'
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
