
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const completeRegistration = async (values: DealerFormValues, userId: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Format and normalize data for submission
      const formattedData = {
        p_email: values.email.trim().toLowerCase(),
        p_password: values.password, // Use the user-provided password
        p_supervisor_name: values.supervisorName.trim(),
        p_company_name: values.companyName.trim(),
        p_tax_id: values.taxId.trim(),
        p_business_registry_number: values.businessRegistryNumber.trim(),
        p_address: values.companyAddress.trim(),
        p_phone_number: values.phoneNumber.trim().replace(/\s+/g, '')
      };

      // Call RPC function to create dealer profile
      const { data, error } = await supabase.rpc(
        'create_dealer_with_profile', 
        formattedData
      );

      if (error) {
        console.error("Profile creation error:", error);
        setErrors([error.message]);
        
        toast({
          title: "Profile Creation Failed",
          description: error.message,
          variant: "destructive",
        });
        
        return false;
      }

      toast({
        title: "Profile Completed",
        description: "Your dealer profile has been successfully created. You can now sign in to access the dealer dashboard.",
      });

      navigate('/auth?tab=login');
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setErrors([errorMessage]);
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    completeRegistration,
    isSubmitting,
    errors
  };
}
