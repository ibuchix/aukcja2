
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseFormSubmissionProps {
  moveToStep: (step: number) => void;
  resetError: () => void;
  setError: (error: string) => void;
}

export function useFormSubmission({ 
  moveToStep, 
  resetError, 
  setError 
}: UseFormSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async (values: DealerFormValues): Promise<boolean> => {
    setIsSubmitting(true);
    resetError();
    
    try {
      console.log("Signing up dealer with email:", values.email);
      
      // First, create the auth user account with email and password
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
        console.error("Auth signup error:", authError);
        
        let errorMessage = "Failed to create account. Please try again.";
        
        if (authError.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
        }
        
        setError(errorMessage);
        toast({
          title: "Signup Error",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Auth signup successful, user created with ID:", authData.user?.id);
      
      // If user was created successfully, create the dealer profile
      if (authData.user?.id) {
        const { error: dealerError } = await supabase
          .from('dealers')
          .insert({
            user_id: authData.user.id,
            supervisor_name: values.supervisorName,
            dealership_name: values.companyName,
            tax_id: values.taxId,
            business_registry_number: values.businessRegistryNumber,
            address: values.companyAddress,
            verification_status: 'pending',
            is_verified: false,
          });
        
        if (dealerError) {
          console.error("Dealer profile creation error:", dealerError);
          setError("Account created but failed to set up dealer profile. Please contact support.");
          toast({
            title: "Profile Error",
            description: "Account created but failed to set up dealer profile. Please contact support.",
            variant: "destructive",
          });
          return false;
        }
        
        // Success! Move to verification step
        console.log("Dealer profile created successfully");
        moveToStep(2); // Move to the "Check your email" step
        
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Please verify your email to continue.",
        });
        
        return true;
      }
      
      setError("Failed to complete registration. Please try again.");
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      setError(errorMessage);
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
