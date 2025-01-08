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
    if (isSubmitting) return { success: false };
    
    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing registration...",
      description: "Please wait while we set up your account.",
    });

    try {
      // Step 1: Create auth user with proper metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName,
          },
          emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        console.error("No user data returned");
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created:", authData.user.id);

      // Step 2: Create dealer profile
      try {
        await createDealerProfile({
          userId: authData.user.id,
          supervisorName: values.supervisorName,
          dealershipName: values.companyName,
          taxId: values.taxId,
          businessRegistryNumber: values.businessRegistryNumber,
          address: values.companyAddress,
        });
        
        console.log("Dealer profile created successfully");
      } catch (dealerError: any) {
        console.error("Failed to create dealer profile:", dealerError);
        // If dealer profile creation fails, we should delete the auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
        if (deleteError) {
          console.error("Failed to cleanup auth user:", deleteError);
        }
        throw new Error("Failed to create dealer profile: " + dealerError.message);
      }

      // Step 3: Send welcome email
      try {
        await sendEmail({
          to: values.email,
          subject: "Welcome to Auto-Strada Dealer Portal",
          html: `
            <div style="font-family: 'Oswald', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #DC143C; font-size: 24px; margin-bottom: 20px;">Welcome to Auto-Strada!</h1>
              
              <p style="font-family: 'Kanit', sans-serif; color: #222020; margin-bottom: 15px;">Dear ${values.supervisorName},</p>
              
              <p style="font-family: 'Kanit', sans-serif; color: #222020; margin-bottom: 15px;">Thank you for registering as a dealer on Auto-Strada. Your account is being set up with the following details:</p>
              
              <div style="background-color: #ECF1F4; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <ul style="font-family: 'Kanit', sans-serif; color: #222020; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Dealership Name: ${values.companyName}</li>
                  <li style="margin-bottom: 10px;">Tax ID: ${values.taxId}</li>
                  <li style="margin-bottom: 10px;">Business Registry Number: ${values.businessRegistryNumber}</li>
                </ul>
              </div>
              
              <p style="font-family: 'Kanit', sans-serif; color: #6A6A77; margin-bottom: 15px;">Please note that your account is pending verification. We will review your details and notify you once your account is verified.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ECF1F4;">
                <p style="font-family: 'Kanit', sans-serif; color: #6A6A77; font-size: 14px;">
                  Best regards,<br>
                  The Auto-Strada Team
                </p>
              </div>
            </div>
          `,
        });
        console.log("Welcome email sent successfully");
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't throw the error, just log it and continue
        // The user is still registered, they just won't receive the welcome email
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