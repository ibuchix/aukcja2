
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useFormValidation } from "@/hooks/useFormValidation";
import { signupDealer } from "@/integrations/dealers/dealerService";
import { checkBusinessRegistryExists } from "@/services/validation/businessRegistryService";
import { checkAccountExists } from "@/utils/authValidation";

/**
 * Custom hook for handling dealer registration form submission with validation
 */
export function useRegistrationSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { 
    errors, 
    validateForm, 
    clearErrors, 
    normalizeData 
  } = useFormValidation<DealerFormValues>('dealer-registration');
  
  const handleSubmit = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    clearErrors();
    
    try {
      console.log("Starting registration validation...");
      
      // Validate form data client-side before proceeding
      const { isValid, sanitizedData } = validateForm(values);
      
      if (!isValid) {
        console.log("Validation failed:", errors);
        toast({
          title: "Form Validation Failed",
          description: errors[0] || "Please correct the errors in the form.",
          variant: "destructive",
        });
        return false;
      }
      
      // Check if email already exists
      const emailExists = await checkAccountExists(sanitizedData.email);
      if (emailExists) {
        toast({
          title: "Email Already In Use",
          description: "An account with this email already exists. Please use a different email or login to your existing account.",
          variant: "destructive",
        });
        return false;
      }
      
      // Check if business registry number already exists
      const businessRegistryExists = await checkBusinessRegistryExists(sanitizedData.businessRegistryNumber);
      if (businessRegistryExists) {
        toast({
          title: "Business Already Registered",
          description: "A dealer with this business registry number is already registered in our system.",
          variant: "destructive",
        });
        return false;
      }
      
      // Normalize data for submission
      const normalizedData = normalizeData(sanitizedData);
      
      // Submit the registration
      console.log("Submitting registration with validated data");
      const result = await signupDealer(normalizedData);
      
      if (!result.success) {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to complete registration. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please check your email for verification.",
      });
      
      return true;
      
    } catch (error) {
      console.error("Registration submission error:", error);
      
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    handleSubmit,
    isSubmitting,
    validationErrors: errors
  };
}
