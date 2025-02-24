
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { DealerFormFields } from "@/components/auth/DealerFormFields";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RegistrationProgress } from "@/components/auth/dealer-form/RegistrationProgress";
import { RegistrationStatus } from "@/components/auth/dealer-form/RegistrationStatus";
import { useSignupDealer } from "@/hooks/useSignupDealer";

export function DealerSignupForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string>("");
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const { signupDealer, isSubmitting, testSignup } = useSignupDealer();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setEmailVerified(true);
        navigate('/dealer/dashboard');
      }
      if (event === 'USER_UPDATED') {
        setEmailVerified(session?.user?.email_confirmed_at !== null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    setAuthError("");
    setRegistrationStep(2);
    
    const result = await signupDealer(values);
    
    if (!result.success) {
      setRegistrationStep(1);
      setAuthError(result.error || "Registration failed");
      toast({
        title: "Registration Failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setRegistrationStep(3);
    toast({
      title: "Registration Successful",
      description: "Please check your email to verify your account.",
      variant: "default",
    });
    form.reset();
  };

  const handleTestSignup = async () => {
    setAuthError("");
    setRegistrationStep(2);
    
    const result = await testSignup();
    
    if (!result.success) {
      setRegistrationStep(1);
      setAuthError(result.error || "Test registration failed");
      toast({
        title: "Test Registration Failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setRegistrationStep(3);
    toast({
      title: "Test Registration Successful",
      description: "Test account created successfully.",
      variant: "default",
    });
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
          
          {process.env.NODE_ENV === 'development' && (
            <Button
              type="button"
              onClick={handleTestSignup}
              className="w-full mt-2"
              variant="secondary"
              disabled={isSubmitting}
            >
              Test Signup with Hardcoded Values
            </Button>
          )}
        </form>
      </Form>
    </>
  );
}
