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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

export function DealerSignupForm() {
  const { signupDealer, isSubmitting } = useSignupDealer();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string>("");

  // Check authentication state on mount and changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_IN' && session) {
        // Only navigate if the user has the dealer role
        if (session.user?.user_metadata?.role === 'dealer') {
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

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          return 'Invalid email or password format';
        case 422:
          return 'Email already registered';
        case 401:
          return 'Invalid credentials';
        default:
          return error.message;
      }
    }
    return error.message;
  };

  const onSubmit = async (values: DealerFormValues) => {
    try {
      setAuthError(""); // Clear any previous errors
      const result = await signupDealer(values);
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        });
        form.reset();
      } else {
        setAuthError(result.error || "Registration failed");
        toast({
          title: "Registration Failed",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof AuthError ? 
        getErrorMessage(error) : 
        error.message || "An unexpected error occurred";
      
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