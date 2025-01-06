import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { createDealerProfile } from "@/services/dealerService";

export function useSignupDealer() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupDealer = async (values: DealerFormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing registration...",
      description: "Please wait while we set up your account.",
    });

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Failed to create user account");

      // Step 2: Get current session immediately after signup
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Failed to get session");
      }

      if (!session) {
        // If no session, try signing in explicitly
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (signInError || !signInData.session) {
          console.error("Sign in error:", signInError);
          throw new Error("Failed to establish session");
        }
      }

      // Step 3: Create dealer profile
      await createDealerProfile({
        userId: authData.user.id,
        supervisorName: values.supervisorName,
        dealershipName: values.companyName,
        taxId: values.taxId,
        businessRegistryNumber: values.businessRegistryNumber,
        address: values.companyAddress,
      });

      // Step 4: Send welcome email
      const { error: emailError } = await supabase.functions.invoke('send-dealer-welcome', {
        body: {
          to: values.email,
          name: values.supervisorName,
          confirmationUrl: `${window.location.origin}/confirm-email`,
        },
      });

      if (emailError) {
        console.error("Email sending error:", emailError);
        toast({
          title: "Email Notification Issue",
          description: "Your account was created but we couldn't send the welcome email. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful!",
          description: "Please check your email to confirm your account. You'll be able to log in after confirmation.",
          duration: 6000,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}