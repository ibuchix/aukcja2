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

      // Try to sign in first to see if the user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      let userId;

      if (!signInError && signInData.user) {
        // User exists and credentials are correct
        userId = signInData.user.id;
        console.log("Existing user signed in:", userId);
      } else {
        // User doesn't exist, create new user
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

        if (!signUpResponse.data?.user?.id) {
          return {
            success: false,
            error: "Failed to create user account",
            errorType: 'auth'
          };
        }

        userId = signUpResponse.data.user.id;
        console.log("New user created:", userId);
      }

      // Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: userId,
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
        // Cleanup the failed registration only if it's a new user
        if (!signInData?.user) {
          await supabase.rpc('cleanup_failed_dealer_registration', {
            user_id_param: userId
          });
        }
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