
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useSignupDealer } from "@/hooks/useSignupDealer";

interface UseFormSubmissionParams {
  moveToStep: (step: number) => void;
  resetError: () => void;
  setError: (error: string) => void;
}

export function useFormSubmission({ moveToStep, resetError, setError }: UseFormSubmissionParams) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signupDealer, isSubmitting } = useSignupDealer();
  const [retryAttempt, setRetryAttempt] = useState(0);

  const handleFormSubmit = async (values: DealerFormValues) => {
    resetError();
    moveToStep(2);
    
    try {
      const result = await signupDealer(values);
      
      if (!result.success) {
        // Network error handling
        if (result.errorType === 'network') {
          setError("Network connection issue. Please try again.");
          toast({
            title: "Network Connection Issue",
            description: "There was a problem connecting to our servers. This is often temporary. Please try again.",
            variant: "destructive",
          });
          
          console.log("Network error during registration, showing detailed guidance");
          
          // Add more detailed troubleshooting toast
          setTimeout(() => {
            toast({
              title: "Troubleshooting Tips",
              description: "Try refreshing the page or check if you have any extensions blocking requests.",
              variant: "default",
              duration: 8000,
            });
          }, 1000);
          
          return;
        }
        
        setError(result.error || "Registration failed");
        
        if (result.error?.includes("already in progress") || result.error?.includes("concurrent")) {
          toast({
            title: "Registration In Progress",
            description: "There is already a registration in progress for this email. Please try again in a moment.",
            variant: "default",
          });
        } else {
          toast({
            title: "Registration Failed",
            description: result.error,
            variant: "destructive",
          });
        }
        
        if (result.error?.includes("already exists")) {
          toast({
            title: "Account Exists",
            description: "Try logging in with your email instead.",
            variant: "default",
          });
        }
        
        return;
      }

      moveToStep(3);
      toast({
        title: "Registration Successful",
        description: result.message || "Please check your email to verify your account.",
        variant: "default",
      });
      return true;
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Check for network-related errors
      const errorMessage = error instanceof Error ? error.message : "Unexpected error during registration";
      if (errorMessage.includes('network') || 
          errorMessage.includes('connection') || 
          errorMessage.includes('internet') || 
          errorMessage.includes('CORS') ||
          errorMessage.includes('503')) {
            
        setError("Network connection issue. Please check your internet and try again.");
        toast({
          title: "Network Connection Issue",
          description: "Please check your internet connection and try again shortly.",
          variant: "destructive",
        });
      } else {
        setError(errorMessage);
        toast({
          title: "Registration Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  return {
    handleFormSubmit,
    isSubmitting
  };
}
