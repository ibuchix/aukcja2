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
            name: values.supervisorName,
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Failed to create user account");

      // Step 2: Create dealer profile
      await createDealerProfile({
        userId: authData.user.id,
        supervisorName: values.supervisorName,
        dealershipName: values.companyName,
        taxId: values.taxId,
        businessRegistryNumber: values.businessRegistryNumber,
        address: values.companyAddress,
      });

      // Step 3: Send welcome email using Resend
      const { error: emailError } = await supabase.functions.invoke('send-dealer-welcome', {
        body: {
          to: values.email,
          name: values.supervisorName,
          confirmationUrl: `${window.location.origin}/confirm-email?token=${authData?.session?.access_token}`,
        },
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't throw here - we still want to show success even if email fails
      }

      toast({
        title: "Registration Successful!",
        description: "Please check your email to confirm your account. You'll be able to log in after confirmation.",
        duration: 6000,
      });

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