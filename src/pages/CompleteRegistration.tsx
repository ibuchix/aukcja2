
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RegistrationCard } from "@/components/complete-registration/RegistrationCard";
import { RegistrationForm } from "@/components/complete-registration/RegistrationForm";
import { useCompleteRegistration } from "@/hooks/useCompleteRegistration";

export default function CompleteRegistration() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { isSubmitting, formErrors, handleSubmit } = useCompleteRegistration(state?.userId);

  useEffect(() => {
    // Check if we have a valid state with userId
    if (!state?.userId) {
      toast({
        title: "Invalid Access",
        description: "Please complete the registration process from the beginning.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [state, navigate, toast]);

  return (
    <RegistrationCard>
      <RegistrationForm
        onSubmit={handleSubmit}
        defaultEmail={state?.email || ""}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
      />
    </RegistrationCard>
  );
}
