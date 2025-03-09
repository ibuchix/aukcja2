import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signupDealer } from "@/integrations/dealers/dealerService";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

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
      // Create the dealer account
      const result = await signupDealer(values);
      
      if (result.success) {
        toast({
          title: "Registration started",
          description: "Please check your email to verify your account",
        });
        
        // Move to next step in the registration process
        moveToStep(1);
        return true;
      } else {
        // Handle registration errors
        const errorMessage = handleRegistrationError(result.error);
        setError(errorMessage);
        
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred during registration.",
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

// Helper function to handle different registration errors
function handleRegistrationError(error: any): string {
  if (!error) return "Unknown error occurred";
  
  // Common error messages
  if (typeof error === 'string') {
    if (error.includes('User already registered')) {
      return "This email is already registered. Please use a different email or login.";
    }
    return error;
  }
  
  // Supabase error objects
  if (error.message) {
    if (error.message.includes('email already exists')) {
      return "This email is already registered. Please use a different email or login.";
    }
    
    if (error.message.includes('Password should be')) {
      return "Password must be at least 6 characters long.";
    }
    
    if (error.message.includes('invalid email')) {
      return "Please enter a valid email address.";
    }
    
    return error.message;
  }
  
  // Fallback
  return "An error occurred during registration. Please try again.";
}
