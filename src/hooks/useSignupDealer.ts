import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { createDealerProfile } from "@/services/dealerService";
import { sendEmail } from "@/services/emailService";
import { AuthError } from "@supabase/supabase-js";

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
      // Step 1: Check if dealer already exists for this email
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (user) {
        // Check if this user already has a dealer profile
        const { data: existingDealer } = await supabase
          .from('dealers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingDealer) {
          throw new Error("A dealer account already exists with this email. Please log in instead.");
        } else {
          throw new Error("An account exists but is not registered as a dealer. Please contact support.");
        }
      }

      // Step 2: Create auth user
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
        if (authError instanceof AuthError && authError.message.includes("already registered")) {
          throw new Error("This email is already registered. Please try logging in instead.");
        }
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        console.error("No user data returned");
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created:", authData.user.id);

      // Step 3: Wait for the user record to be fully created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Verify the user exists in the database
      const { data: userCheck, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (userCheckError || !userCheck) {
        console.error("User profile not found:", userCheckError);
        throw new Error("Failed to verify user creation. Please try again.");
      }

      // Step 5: Create dealer profile
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
        throw new Error("Failed to create dealer profile: " + dealerError.message);
      }

      // Step 6: Send welcome email
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