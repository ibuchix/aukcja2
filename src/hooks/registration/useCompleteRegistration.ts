
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { validateFormData } from "./validateFormData";
import { submitRegistration } from "./submitRegistration";

export function useCompleteRegistration(userId: string | undefined) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (values: DealerFormValues) => {
    if (!userId) {
      toast({
        title: "Invalid Access",
        description: "Please complete the registration process from the beginning.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Clear previous errors
    setFormErrors([]);

    // Perform additional client-side validation
    const errors = validateFormData(values);
    if (errors.length > 0) {
      setFormErrors(errors);
      // Also show toast for the first error
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await submitRegistration(values, userId);

      toast({
        title: "Registration Complete",
        description: "Your dealer profile has been created successfully.",
      });

      navigate('/dealer/dashboard');
    } catch (error) {
      console.error("Profile completion error:", error);
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes("duplicate key") || error.message.includes("unique violation")) {
          setFormErrors(["A dealer with this information already exists. Please check your tax ID and business registry number."]);
        } else {
          setFormErrors([error.message]);
        }
      } else {
        setFormErrors(["An unexpected error occurred"]);
      }
      
      toast({
        title: "Registration Failed",
        description: "Failed to complete registration. Please check the errors and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    formErrors,
    handleSubmit,
    setFormErrors
  };
}
