
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { DealerFormFields } from "@/components/auth/DealerFormFields";
import { Loader2 } from "lucide-react";
import { RegistrationProgress } from "@/components/auth/dealer-form/RegistrationProgress";
import { RegistrationStatus } from "@/components/auth/dealer-form/RegistrationStatus";
import { useRegistrationSteps } from "@/components/auth/dealer-form/useRegistrationSteps";
import { useAuthStateMonitor } from "@/components/auth/dealer-form/useAuthStateMonitor";
import { useFormSubmission } from "@/components/auth/dealer-form/useFormSubmission";
import { useState } from "react";

export function DealerSignupForm({ onRegistrationComplete }: { onRegistrationComplete?: () => void }) {
  const {
    registrationStep,
    emailVerified,
    authError,
    setEmailVerified,
    moveToStep,
    resetError,
    setError
  } = useRegistrationSteps();
  
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  // Monitor auth state changes
  useAuthStateMonitor(setEmailVerified);

  const {
    handleFormSubmit,
    isSubmitting
  } = useFormSubmission({
    moveToStep,
    resetError,
    setError,
    onComplete: () => {
      setRegistrationSubmitted(true);
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    }
  });

  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      companyName: "",
      taxId: "",
      businessRegistryNumber: "",
      companyAddress: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: DealerFormValues) => {
    const success = await handleFormSubmit(values);
    if (success) {
      form.reset();
    }
  };

  return (
    <>
      <RegistrationProgress step={registrationStep} />
      <RegistrationStatus 
        error={authError}
        emailVerified={emailVerified}
        registrationStep={registrationStep}
      />

      {registrationSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <h3 className="text-green-800 font-medium">Registration Complete!</h3>
          <p className="text-green-700 text-sm mt-1">
            Your account has been created successfully. You can now log in with your credentials.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DealerFormFields form={form} />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing up...
                </>
              ) : "Sign Up"}
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
