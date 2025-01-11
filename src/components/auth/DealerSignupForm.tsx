import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { DealerFormFields } from "./DealerFormFields";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RegistrationProgress } from "./dealer-form/RegistrationProgress";
import { RegistrationStatus } from "./dealer-form/RegistrationStatus";

export function DealerSignupForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);

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
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setAuthError("");
    setRegistrationStep(2);
    
    try {
      console.log("Starting dealer registration with:", values.email);
      
      // Step 1: Create auth user with metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
        }
      });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);
        setRegistrationStep(1);
        setAuthError(signUpError.message);
        toast({
          title: "Registration Failed",
          description: signUpError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user?.id) {
        throw new Error("Failed to create user account");
      }

      // Step 2: Create dealer profile
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: values.supervisorName.trim(),
          dealership_name: values.companyName.trim(),
          tax_id: values.taxId.trim(),
          business_registry_number: values.businessRegistryNumber.trim(),
          license_number: values.businessRegistryNumber.trim(),
          address: values.companyAddress.trim(),
          verification_status: 'pending',
          is_verified: false,
        });

      if (dealerError) {
        console.error("Dealer profile creation error:", dealerError);
        // Cleanup the auth user if dealer profile creation fails
        await supabase.auth.signOut();
        setRegistrationStep(1);
        setAuthError("Failed to create dealer profile. Please try again.");
        toast({
          title: "Profile Creation Failed",
          description: dealerError.message,
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
      
    } catch (error) {
      console.error("Registration error:", error);
      setRegistrationStep(1);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setAuthError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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