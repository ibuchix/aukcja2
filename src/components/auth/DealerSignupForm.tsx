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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
        // Check if dealer profile exists and verification status
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

        // Redirect to dashboard if profile exists and email is verified
        if (session.user?.user_metadata?.role === 'dealer' && dealerProfile && emailVerified) {
          navigate('/dealer/dashboard');
        }
      }
      if (event === 'USER_UPDATED') {
        setAuthError(""); // Clear any errors when user is updated
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
      setAuthError(""); // Clear any previous errors
      setRegistrationStep(2); // Move to processing step
      
      // Trim email to prevent whitespace issues
      const trimmedValues = {
        ...values,
        email: values.email.trim().toLowerCase()
      };

      console.log("Attempting registration with email:", trimmedValues.email);
      
      const result = await signupDealer(trimmedValues);
      
      if (result.success) {
        setRegistrationStep(3); // Move to success step
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account. You'll be notified once your dealer account is approved.",
          variant: "default",
        });
        form.reset();
      } else {
        setRegistrationStep(1); // Reset to form step on error
        // Handle specific error cases
        if (result.error?.includes("User already registered")) {
          setAuthError("This email is already registered. Please try logging in or use a different email address.");
          toast({
            title: "Registration Failed",
            description: "This email is already registered. Please try logging in or use a different email address.",
            variant: "destructive",
          });
          return;
        }

        setAuthError(result.error || "Registration failed");
        
        const toastMessage = {
          auth: "Authentication Error",
          database: "Profile Creation Error",
          validation: "Validation Error"
        }[result.errorType || 'validation'];

        toast({
          title: toastMessage,
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      setRegistrationStep(1); // Reset to form step on error
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

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <span>Registration</span>
        <span>Processing</span>
        <span>Completion</span>
      </div>
      <Progress value={(registrationStep / 3) * 100} className="h-2" />
    </div>
  );

  const renderEmailVerificationStatus = () => {
    if (registrationStep === 3 && !emailVerified) {
      return (
        <Alert className="mb-4 bg-[#EFEFFD] border-[#4B4DED]">
          <CheckCircle2 className="h-4 w-4 text-[#4B4DED]" />
          <AlertTitle className="text-[#4B4DED]">Email Verification Required</AlertTitle>
          <AlertDescription>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            After verification, your dealer application will be reviewed by our team.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <>
      {renderStepIndicator()}
      
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {renderEmailVerificationStatus()}

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