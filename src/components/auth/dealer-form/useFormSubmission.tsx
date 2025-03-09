
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signupDealer } from "@/integrations/dealers/dealerService";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { normalizeEmail, normalizePhoneNumber } from "@/utils/dealerProfileMapping";

export function useFormSubmission({
  moveToStep,
  resetError,
  setError
}: {
  moveToStep: (step: number) => void;
  resetError: () => void;
  setError: (message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Handle form submission
  const handleFormSubmit = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    resetError();
    
    try {
      console.log("Starting dealer registration process...");
      console.log("Registration values:", { 
        email: normalizeEmail(values.email), 
        companyName: values.companyName,
        supervisorName: values.supervisorName,
        businessRegistryNumber: values.businessRegistryNumber,
        taxId: values.taxId
      });
      
      // Make sure all required fields are present and not empty
      const requiredFields = [
        'supervisorName', 
        'companyName', 
        'taxId', 
        'businessRegistryNumber', 
        'companyAddress'
      ];
      
      const missingFields = requiredFields.filter(field => 
        !values[field as keyof DealerFormValues] || 
        (typeof values[field as keyof DealerFormValues] === 'string' && 
         (values[field as keyof DealerFormValues] as string).trim() === '')
      );
      
      if (missingFields.length > 0) {
        const formattedFields = missingFields.map(field => 
          field.replace(/([A-Z])/g, ' $1').toLowerCase()
        ).join(', ');
        
        setError(`Please complete all required fields: ${formattedFields}`);
        toast({
          title: "Missing information",
          description: `Please complete all required fields: ${formattedFields}`,
          variant: "destructive",
        });
        return false;
      }
      
      // Create the dealer account
      const result = await signupDealer(values);
      
      if (result.success) {
        console.log("Registration successful");
        console.log("User data:", result.user);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created with a complete profile. You can now log in.",
          duration: 6000, // Show for 6 seconds
        });
        
        // Move to next step in the registration process
        moveToStep(2);
        return true;
      } else {
        // Handle registration errors
        console.error("Registration failed:", result.error);
        const errorMessage = handleRegistrationError(result.error);
        setError(errorMessage);
        
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
          duration: 8000, // Show error messages longer
        });
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred during registration. Please try again later.",
        variant: "destructive",
        duration: 8000,
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

// Helper function to handle different registration errors
function handleRegistrationError(error: any): string {
  if (!error) return "Unknown error occurred during registration";
  
  // Common error messages with improved clarity
  if (typeof error === 'string') {
    if (error.includes('User already registered') || error.includes('already exists')) {
      return "This email is already registered. Please use a different email or login with your existing account.";
    }
    
    if (error.includes('Password')) {
      return "Password issue: " + error;
    }
    
    return error;
  }
  
  // Supabase error objects
  if (error.message) {
    if (error.message.includes('email already exists') || error.message.includes('unique_violation')) {
      return "This email is already registered. Please use a different email or login with your existing account.";
    }
    
    if (error.message.includes('Password should be')) {
      return "Password must be at least 8 characters long and meet security requirements.";
    }
    
    if (error.message.includes('invalid email')) {
      return "Please enter a valid email address.";
    }
    
    return error.message;
  }
  
  // PostgreSQL errors
  if (error.code) {
    if (error.code === '23505') { // unique_violation
      return "This information is already registered in our system.";
    }
    
    if (error.code === '23514') { // check_violation
      return "Some fields don't meet the required format. Please check and try again.";
    }
  }
  
  // Fallback
  return "An error occurred during registration. Please try again or contact support.";
}
