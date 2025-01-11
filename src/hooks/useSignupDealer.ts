import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
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
      
      // First check if the email exists as a dealer
      const { data: emailExists, error: checkError } = await supabase
        .rpc('check_dealer_email_exists', {
          email_to_check: values.email.trim().toLowerCase()
        });

      if (checkError) {
        console.error("Error checking email:", checkError);
        return {
          success: false,
          error: "Error checking email availability",
          errorType: 'database'
        };
      }

      if (emailExists) {
        return {
          success: false,
          error: "This email is already registered as a dealer",
          errorType: 'validation'
        };
      }

      // Check if the email exists in auth system
      const { data: userExists, error: userCheckError } = await supabase
        .rpc('check_email_exists', {
          email_to_check: values.email.trim().toLowerCase()
        });

      if (userCheckError) {
        console.error("Error checking user:", userCheckError);
        return {
          success: false,
          error: "Error checking email availability",
          errorType: 'database'
        };
      }

      if (userExists) {
        return {
          success: false,
          error: "This email is already registered. Please use a different email address or contact support if you need assistance.",
          errorType: 'validation'
        };
      }

      // Create new user
      const signUpResponse = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
        }
      });

      if (signUpResponse.error) {
        console.error("Auth signup error:", signUpResponse.error);
        return {
          success: false,
          error: signUpResponse.error.message,
          errorType: 'auth'
        };
      }

      const { data } = signUpResponse;

      if (!data?.user?.id) {
        return {
          success: false,
          error: "Failed to create user account",
          errorType: 'auth'
        };
      }

      console.log("Auth user created successfully:", data.user.id);

      // Create dealer profile
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
        // Cleanup the failed registration
        await supabase.rpc('cleanup_failed_dealer_registration', {
          user_id_param: data.user.id
        });
        return {
          success: false,
          error: dealerError.message,
          errorType: 'database'
        };
      }

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