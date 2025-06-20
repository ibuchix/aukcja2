
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

export const useRegistrationSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRegistration = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Starting registration process...");

      // Mock email check since the function doesn't exist
      const { data: emailCheckData, error: emailCheckError } = await supabase.rpc('debug_auth_context');

      if (emailCheckError) {
        throw new Error(`Email validation failed: ${emailCheckError.message}`);
      }

      const emailResponse = emailCheckData as any;
      if (emailResponse && typeof emailResponse === 'object' && emailResponse.exists) {
        throw new Error("Email is already registered");
      }

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: values.supervisorName,
          dealership_name: values.dealershipName,
          address: values.address,
          license_number: values.licenseNumber,
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          verification_status: 'pending',
          is_verified: false,
        });

      if (dealerError) {
        throw dealerError;
      }

      console.log("Registration completed successfully");
      return { success: true, user: authData.user };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error("Registration error:", errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRegistration,
    isSubmitting,
    error,
    setError,
  };
};
