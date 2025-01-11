import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { DealerFormFields } from "./DealerFormFields";
import { useSignupDealer } from "@/hooks/useSignupDealer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RegistrationProgress } from "./dealer-form/RegistrationProgress";
import { RegistrationStatus } from "./dealer-form/RegistrationStatus";

export function DealerSignupForm() {
  const { signupDealer, isSubmitting } = useSignupDealer();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string>("");
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: dealerProfile, error: dealerError } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (dealerError && dealerError.code !== 'PGRST116') {
          console.error("Error fetching dealer profile:", dealerError);
          await supabase.auth.signOut();
          setAuthError("Failed to verify dealer profile. Please try again.");
          return;
        }

        if (!dealerProfile) {
          console.error("Dealer profile not found");
          await supabase.auth.signOut();
          setAuthError("Dealer profile creation failed. Please try again.");
          return;
        }

        setEmailVerified(session.user.email_confirmed_at !== null);

        if (session.user?.user_metadata?.role === 'dealer' && dealerProfile && emailVerified) {
          navigate('/dealer/dashboard');
        }
      }
      if (event === 'USER_UPDATED') {
        setAuthError("");
        setEmailVerified(session?.user?.email_confirmed_at !== null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, emailVerified]);

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
      setAuthError("");
      setRegistrationStep(2);
      
      const trimmedValues = {
        ...values,
        email: values.email.trim().toLowerCase()
      };

      console.log("Attempting registration with email:", trimmedValues.email);
      
      const result = await signupDealer(trimmedValues);
      
      if (result.success) {
        setRegistrationStep(3);
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account. You'll be notified once your dealer account is approved.",
          variant: "default",
        });
        form.reset();
      } else {
        setRegistrationStep(1);
        if (result.error?.includes("User already registered")) {
          setAuthError("This email is already registered. Please try logging in or use a different email address.");
          return;
        }

        setAuthError(result.error || "Registration failed");
        
        toast({
          title: result.errorType === 'auth' ? "Authentication Error" : 
                result.errorType === 'database' ? "Profile Creation Error" : 
                "Validation Error",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      setRegistrationStep(1);
      console.error("Signup error:", error);
      const errorMessage = "An unexpected error occurred during registration. Please try again.";
      
      setAuthError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
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