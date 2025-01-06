import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { createDealerProfile } from "@/services/dealerService";
import { sendEmail } from "@/services/emailService";

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
          emailRedirectTo: `${window.location.origin}/confirm-email`,
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

      // Step 3: Send welcome email
      await sendEmail({
        to: values.email,
        subject: "Welcome to Auto-Strada Dealer Portal",
        html: `
          <h1>Welcome to Auto-Strada!</h1>
          <p>Dear ${values.supervisorName},</p>
          <p>Thank you for registering as a dealer on Auto-Strada. Your account is being set up with the following details:</p>
          <ul>
            <li>Dealership Name: ${values.companyName}</li>
            <li>Tax ID: ${values.taxId}</li>
            <li>Business Registry Number: ${values.businessRegistryNumber}</li>
          </ul>
          <p>Please note that your account is pending verification. We will review your details and notify you once your account is verified.</p>
          <p>Best regards,<br>The Auto-Strada Team</p>
        `,
      });

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