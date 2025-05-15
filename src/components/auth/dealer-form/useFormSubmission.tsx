
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useCompleteRegistration } from "@/hooks/registration/useCompleteRegistration";

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
  const { handleSubmit: completeRegistration } = useCompleteRegistration();
  
  const handleFormSubmit = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    resetError();
    
    try {
      console.log("Starting dealer registration process...");
      
      // Call our registration hook that handles both auth and profile creation
      const result = await completeRegistration(values);
      
      if (result.success) {
        console.log("Registration successful");
        
        toast({
          title: "Registration successful",
          description: "Your account has been created. Please check your email for verification.",
          duration: 6000,
        });
        
        moveToStep(2);
        return true;
      } else {
        console.error("Registration failed:", result.error);
        setError(result.error || "Registration failed");
        
        toast({
          title: "Registration failed",
          description: result.error || "Registration failed for an unknown reason",
          variant: "destructive",
          duration: 8000,
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
