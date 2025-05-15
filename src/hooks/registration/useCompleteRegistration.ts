
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
      console.log("Creating dealer account with direct auth API");
      
      // Create user with direct auth API - explicitly disable email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: {
            name: values.supervisorName.trim(),
            role: 'dealer'
          },
          // Explicitly disable email verification
          emailRedirectTo: undefined,
          emailConfirm: false
        }
      });
      
      if (authError) {
        console.error("Error creating user account:", authError);
        
        return {
          success: false,
          error: `Registration failed: ${authError.message}`
        };
      }
      
      // Now create the dealer profile
      if (authData?.user) {
        console.log("User created, now creating dealer profile");
        
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealers')
          .insert({
            user_id: authData.user.id,
            supervisor_name: values.supervisorName.trim(),
            dealership_name: values.companyName.trim(),
            tax_id: values.taxId.trim(),
            business_registry_number: values.businessRegistryNumber.trim(),
            address: values.companyAddress.trim(),
            verification_status: 'pending',
            is_verified: false,
            license_number: values.businessRegistryNumber.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (dealerError) {
          console.error("Error creating dealer profile:", dealerError);
          
          return {
            success: true, // Still return success since user account was created
            error: `Your account was created but there was an issue with your dealer profile: ${dealerError.message}`,
            userId: authData.user.id
          };
        }
        
        // Update user metadata and profile
        try {
          // Create profile with dealer role
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              role: 'dealer',
              full_name: values.supervisorName.trim(),
              updated_at: new Date().toISOString()
            });
            
          if (profileError) {
            console.warn("Error creating profile:", profileError);
          }
        } catch (metaError) {
          console.warn("Error updating profile:", metaError);
        }
        
        return {
          success: true,
          userId: authData.user.id
        };
      }
      
      return {
        success: false,
        error: "Registration failed: No user data returned"
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
