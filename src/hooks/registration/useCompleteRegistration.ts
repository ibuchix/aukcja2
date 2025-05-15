
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { supabase } from "@/integrations/supabase/client";

interface CompleteRegistrationResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: DealerFormValues): Promise<CompleteRegistrationResult> => {
    setIsSubmitting(true);
    
    try {
      console.log("Creating dealer account through RPC function");
      
      // Use the RPC function to create the user and dealer profile in one transaction
      const { data: result, error } = await supabase.rpc(
        'create_dealer_with_profile',
        {
          p_email: values.email.trim().toLowerCase(),
          p_password: values.password,
          p_supervisor_name: values.supervisorName.trim(),
          p_company_name: values.companyName.trim(),
          p_tax_id: values.taxId.trim(),
          p_business_registry_number: values.businessRegistryNumber.trim(),
          p_address: values.companyAddress.trim(),
          p_phone_number: values.phoneNumber.trim()
        }
      );
      
      if (error) {
        console.error("Error creating dealer with RPC:", error);
        
        // Check for duplicate email
        if (error.message.toLowerCase().includes("email already exists")) {
          return {
            success: false,
            error: "An account with this email already exists. Please sign in or use a different email."
          };
        }
        
        // Check for other constraints
        if (error.code === '23505') { // Unique violation
          if (error.message.toLowerCase().includes("tax_id")) {
            return {
              success: false,
              error: "This tax ID is already registered in our system."
            };
          }
          if (error.message.toLowerCase().includes("business_registry_number")) {
            return {
              success: false,
              error: "This business registry number is already registered in our system."
            };
          }
        }
        
        return {
          success: false,
          error: `Registration failed: ${error.message}`
        };
      }
      
      // Check if the result is successful
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      
      if (!parsedResult.success) {
        return {
          success: false,
          error: parsedResult.error || "Failed to complete registration"
        };
      }
      
      // Return success with user ID
      return {
        success: true,
        userId: parsedResult.user?.id
      };
      
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during registration"
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
}
