import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/dealerAuthService";
import { createDealerProfile } from "@/services/dealerProfileService";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/utils/registrationUtils";

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName.trim(),
          },
        }
      });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);
        return {
          success: false,
          error: signUpError.message,
          errorType: 'auth'
        };
      }

      if (!data?.user?.id) {
        return {
          success: false,
          error: "Failed to create user account",
          errorType: 'auth'
        };
      }

      console.log("Auth user created successfully:", data.user.id);

      // Step 2: Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: data.user.id,
          supervisor_name: values.supervisorName.trim(),
          dealership_name: values.companyName.trim(),
          tax_id: values.taxId.trim(),
          business_registry_number: values.businessRegistryNumber.trim(),
          license_number: values.businessRegistryNumber.trim(),
          address: values.companyAddress.trim(),
          verification_status: 'pending',
          is_verified: false,
        });

      if (dealerError) {
        console.error("Dealer profile creation error:", dealerError);
        return {
          success: false,
          error: dealerError.message,
          errorType: 'database'
        };
      }

      console.log("Dealer profile created successfully");
      return { success: true };
      
    } catch (error) {
      console.error("Registration error:", error);
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