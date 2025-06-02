
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useEnhancedFormValidation } from "./useEnhancedFormValidation";
import { signupDealer } from "@/integrations/dealers/dealerService";
import { checkBusinessRegistryExists } from "@/services/validation/businessRegistryService";
import { checkAccountExists } from "@/utils/authValidation";

/**
 * Custom hook for handling dealer registration form submission with enhanced validation and toast feedback
 */
export function useRegistrationSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { 
    errors, 
    validateFormWithToasts, 
    clearErrors, 
    normalizeData 
  } = useEnhancedFormValidation();
  
  const handleSubmit = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    clearErrors();
    
    try {
      console.log("Starting registration validation...");
      
      // Show initial validation toast
      toast({
        title: "Validating Registration Data",
        description: "Checking all form fields and requirements...",
      });
      
      // Validate form data client-side with enhanced toast feedback
      const { isValid, sanitizedData } = validateFormWithToasts(values);
      
      if (!isValid) {
        console.log("Validation failed:", errors);
        return false;
      }
      
      // Show progress toast for backend validation
      toast({
        title: "Verifying Business Information",
        description: "Checking email and business registry in our database...",
      });
      
      // Check if email already exists - passing true to indicate this is a registration flow
      const emailExists = await checkAccountExists(sanitizedData.email, true);
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
      
      // Show progress toast for account creation
      toast({
        title: "Creating Your Account",
        description: "Setting up your dealer account and profile...",
      });
      
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
        title: "Registration Successful! 🎉",
        description: "Your dealer account has been created successfully. Please check your email for verification.",
      });
      
      return true;
      
    } catch (error) {
      console.error("Registration submission error:", error);
      
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during registration",
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
