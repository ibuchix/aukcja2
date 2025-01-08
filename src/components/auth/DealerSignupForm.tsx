import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { DealerFormFields } from "./DealerFormFields";
import { useSignupDealer } from "@/hooks/useSignupDealer";
import { useToast } from "@/hooks/use-toast";

export function DealerSignupForm() {
  const { signupDealer, isSubmitting } = useSignupDealer();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: "",
      password: "",
      phoneNumber: "",
      companyName: "",
      taxId: "",
      businessRegistryNumber: "",
      companyAddress: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: DealerFormValues) => {
    try {
      const result = await signupDealer(values);
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        });
        form.reset();
        navigate('/dealer/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DealerFormFields form={form} />
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
}