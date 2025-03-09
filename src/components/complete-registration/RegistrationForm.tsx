
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { DealerFormFields } from "@/components/auth/DealerFormFields";
import { dealerFormSchema, DealerFormValues } from "@/schemas/dealerFormSchema";
import { ValidationErrors } from "./ValidationErrors";

interface RegistrationFormProps {
  onSubmit: (values: DealerFormValues) => Promise<void>;
  defaultEmail?: string;
  isSubmitting: boolean;
  formErrors: string[];
  showPasswordFields?: boolean;
}

export function RegistrationForm({ 
  onSubmit, 
  defaultEmail = "", 
  isSubmitting, 
  formErrors,
  showPasswordFields = false
}: RegistrationFormProps) {
  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: defaultEmail,
      password: "",
      confirmPassword: "",
      phoneNumber: "+",
      companyName: "",
      taxId: "",
      businessRegistryNumber: "",
      companyAddress: "",
      acceptTerms: false,
    },
    mode: "onBlur",
  });

  return (
    <>
      <ValidationErrors errors={formErrors} />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <DealerFormFields form={form} showPasswordFields={showPasswordFields} />
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Registration...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
