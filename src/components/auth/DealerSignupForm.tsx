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
import { AlertCircle } from "lucide-react";

export function DealerSignupForm() {
  const { signupDealer, isSubmitting } = useSignupDealer();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string>("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if dealer profile exists before navigation
        const { data: dealerProfile, error: dealerError } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(); // Changed from single() to maybeSingle()

        if (dealerError) {
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

        if (session.user?.user_metadata?.role === 'dealer' && dealerProfile) {
          navigate('/dealer/dashboard');
        }
      }
      if (event === 'USER_UPDATED') {
        setAuthError(""); // Clear any errors when user is updated
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
    try {
      setAuthError(""); // Clear any previous errors
      const result = await signupDealer(values);
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
          variant: "default",
        });
        form.reset();
      } else {
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
      console.error("Signup error:", error);
      const errorMessage = "An unexpected error occurred during registration";
      
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
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
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
    </>
  );
}