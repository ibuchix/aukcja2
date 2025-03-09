
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

export function DealerSignupForm() {
  const {
    registrationStep,
    emailVerified,
    authError,
    setEmailVerified,
    moveToStep,
    resetError,
    setError
  } = useRegistrationSteps();

  // Monitor auth state changes
  useAuthStateMonitor(setEmailVerified);

  const {
    handleFormSubmit,
    isSubmitting
  } = useFormSubmission({
    moveToStep,
    resetError,
    setError
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
    </>
  );
}
