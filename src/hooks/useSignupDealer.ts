import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/dealerAuthService";
import { createDealerProfile } from "@/services/dealerProfileService";
import { supabase } from "@/integrations/supabase/client";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation';
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Step 1: Create auth user with dealer role
      const authResult = await signUpDealerWithEmail(
        values.email,
        values.password,
        {
          role: 'dealer',
          name: values.supervisorName.trim(),
        }
      );

      if (!authResult.success || !authResult.userId) {
        return {
          success: false,
          error: authResult.error || "Authentication failed",
          errorType: 'auth'
        };
      }

      console.log("Auth user created successfully:", authResult.userId);

      // Step 2: Create dealer profile
      const profileResult = await createDealerProfile(authResult.userId, values);
      
      if (!profileResult.success) {
        // If profile creation fails, attempt to clean up the auth user
        await supabase.auth.signOut();
        
        return {
          success: false,
          error: profileResult.error || "Failed to create dealer profile",
          errorType: profileResult.errorType || 'database'
        };
      }

      console.log("Dealer profile created successfully");
      return { success: true };
      
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("User already registered")) {
          return {
            success: false,
            error: "This email is already registered. Please try logging in instead.",
            errorType: 'auth'
          };
        }
      }
      
      // Attempt to clean up on unexpected errors
      await supabase.auth.signOut();
      
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