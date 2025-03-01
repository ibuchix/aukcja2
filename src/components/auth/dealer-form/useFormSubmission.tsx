
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

  const handleFormSubmit = async (values: DealerFormValues) => {
    resetError();
    moveToStep(2);
    
    try {
      const result = await signupDealer(values);
      
      if (!result.success) {
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
        description: "Please check your email to verify your account.",
        variant: "default",
      });
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unexpected error during registration");
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "Unexpected error during registration",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleFormSubmit,
    isSubmitting
  };
}
