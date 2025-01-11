import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/dealerAuthService";
import { createDealerProfile } from "@/services/dealerProfileService";
import { supabase } from "@/integrations/supabase/client";
import { 
  checkEmailExists, 
  cleanupFailedRegistration, 
  MAX_RETRIES, 
  withTimeout 
} from "@/utils/registrationUtils";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation';
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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
      
      // Check for existing email before attempting registration
      const emailExists = await withTimeout(checkEmailExists(values.email.trim()));
      if (emailExists) {
        return {
          success: false,
          error: "This email is already registered. Please try logging in or use a different email address.",
          errorType: 'auth'
        };
      }

      // Step 1: Create auth user with dealer role
      const authResult = await withTimeout(signUpDealerWithEmail(
        values.email.trim(),
        values.password,
        {
          role: 'dealer',
          name: values.supervisorName.trim(),
        }
      ));

      if (!authResult.success) {
        console.log("Auth result error:", authResult.error);
        return {
          success: false,
          error: authResult.error || "Authentication failed",
          errorType: 'auth'
        };
      }

      if (!authResult.userId) {
        return {
          success: false,
          error: "Failed to create user account",
          errorType: 'auth'
        };
      }

      console.log("Auth user created successfully:", authResult.userId);

      // Step 2: Create dealer profile with retry mechanism
      let profileResult;
      while (retryCount < MAX_RETRIES) {
        try {
          profileResult = await withTimeout(createDealerProfile(authResult.userId, values));
          if (profileResult.success) break;
          
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        } catch (error) {
          if (retryCount === MAX_RETRIES - 1) throw error;
          setRetryCount(prev => prev + 1);
          continue;
        }
      }
      
      if (!profileResult?.success) {
        // Clean up the auth user if profile creation fails
        await cleanupFailedRegistration(authResult.userId);
        
        return {
          success: false,
          error: profileResult?.error || "Failed to create dealer profile",
          errorType: profileResult?.errorType || 'database'
        };
      }

      console.log("Dealer profile created successfully");
      return { success: true };
      
    } catch (error) {
      console.error("Registration error:", error);
      
      // Attempt to clean up on unexpected errors
      if (error instanceof Error && 'userId' in error) {
        await cleanupFailedRegistration((error as any).userId);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        errorType: 'validation'
      };
    } finally {
      setIsSubmitting(false);
      setRetryCount(0);
    }
  };

  return { signupDealer, isSubmitting };
}