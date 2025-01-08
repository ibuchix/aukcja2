import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { AuthError } from "@supabase/supabase-js";

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupDealer = async (values: DealerFormValues) => {
    if (isSubmitting) return { success: false };
    
    setIsSubmitting(true);
    
    try {
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

      // Step 2: Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert([
          {
            user_id: authData.user.id,
            supervisor_name: values.supervisorName,
            dealership_name: values.companyName,
            tax_id: values.taxId,
            business_registry_number: values.businessRegistryNumber,
            address: values.companyAddress,
            verification_status: 'pending',
          },
        ]);

      if (dealerError) {
        console.error("Dealer creation error:", dealerError);
        throw dealerError;
      }

      return { success: true };
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.message.includes("already registered")) {
          throw new Error("This email is already registered. Please try logging in instead.");
        }
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}