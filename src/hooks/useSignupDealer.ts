import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { AuthError } from "@supabase/supabase-js";

interface SignupResult {
  success: boolean;
  error?: string;
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupDealer = async (values: DealerFormValues): Promise<SignupResult> => {
    if (isSubmitting) return { success: false, error: "Registration in progress" };
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting dealer registration process");
      
      // Step 1: Create auth user with dealer role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName,
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Step 2: Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: values.supervisorName,
          dealership_name: values.companyName,
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          license_number: values.businessRegistryNumber, // Using business registry number as license number
          address: values.companyAddress,
          verification_status: 'pending',
        });

      if (dealerError) {
        console.error("Dealer creation error:", dealerError);
        // If dealer profile creation fails, we should handle the cleanup
        await supabase.auth.signOut(); // Sign out the user
        throw dealerError;
      }

      console.log("Dealer profile created successfully");
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";
      
      if (error instanceof AuthError) {
        if (error.message.includes("already registered")) {
          errorMessage = "This email is already registered. Please try logging in instead.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}