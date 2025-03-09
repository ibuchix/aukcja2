
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { supabase } from "@/integrations/supabase/client";

interface UseFormSubmissionParams {
  moveToStep: (step: number) => void;
  resetError: () => void;
  setError: (error: string) => void;
}

export function useFormSubmission({ moveToStep, resetError, setError }: UseFormSubmissionParams) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (values: DealerFormValues) => {
    resetError();
    moveToStep(2);
    setIsSubmitting(true);
    
    try {
      // Create user with email and password using Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.supervisorName,
            phone_number: values.phoneNumber,
            role: 'dealer'
          }
        }
      });
      
      if (authError) {
        console.error("Auth error:", authError);
        setError(authError.message);
        moveToStep(1);
        
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive",
        });
        
        return false;
      }
      
      if (!authData.user) {
        setError("Failed to create user account");
        moveToStep(1);
        
        toast({
          title: "Registration Failed",
          description: "Failed to create user account",
          variant: "destructive",
        });
        
        return false;
      }
      
      // Create dealer profile
      const { error: profileError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: values.supervisorName,
          dealership_name: values.companyName,
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          address: values.companyAddress,
          license_number: values.businessRegistryNumber, // Using business registry as license
          verification_status: 'pending',
          is_verified: false
        });
      
      if (profileError) {
        console.error("Profile error:", profileError);
        setError(profileError.message);
        moveToStep(1);
        
        toast({
          title: "Profile Creation Failed",
          description: profileError.message,
          variant: "destructive",
        });
        
        return false;
      }
      
      // Move to success step
      moveToStep(3);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully. Please check your email for verification.",
      });
      
      return true;
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      setError(errorMessage);
      moveToStep(1);
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleFormSubmit,
    isSubmitting
  };
}
