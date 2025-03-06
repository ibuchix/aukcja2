
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { verifyOtp } from "@/services/auth/signin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// OTP validation schema
const otpSchema = z.object({
  otp: z.string().length(6, "Code must be 6 characters")
});

export type OtpFormValues = z.infer<typeof otpSchema>;

export function useOtpForm(
  email: string,
  setStep: (step: "email" | "otp") => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Handle OTP verification
  const onOtpSubmit = async (values: OtpFormValues) => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email information is missing. Please go back and enter your email.",
        variant: "destructive",
      });
      setStep("email");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(email, values.otp);
      
      if (result.success && result.exchangeToken) {
        // NEW: Exchange the temporary token for a session
        console.log("Received exchange token, creating session...");
        
        // Set the auth override
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.exchangeToken,
          refresh_token: result.exchangeToken // Use the same token as refresh
        });
        
        if (sessionError) {
          console.error("Error setting session:", sessionError);
          throw new Error(sessionError.message);
        }
        
        // Refresh the session in our auth context
        await refreshSession();
        
        toast({
          title: "Login successful!",
          description: "Redirecting to your dashboard...",
        });
        
        // Small delay to allow the success toast to be seen
        setTimeout(() => {
          navigate("/dealer/dashboard");
        }, 500);
      } else if (result.success) {
        // Fall back to the old method if no exchange token
        await refreshSession();
        
        toast({
          title: "Login successful!",
          description: "Redirecting to your dashboard...",
        });
        
        setTimeout(() => {
          navigate("/dealer/dashboard");
        }, 500);
      } else {
        toast({
          title: "Invalid code",
          description: result.error || "The code you entered is invalid or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: "Failed to verify your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP - make sure we use our custom OTP edge function
  const handleResendOtp = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email information is missing. Please go back and enter your email.",
        variant: "destructive",
      });
      setStep("email");
      return;
    }

    // Use a separate loading state for resending to avoid clearing the form
    setIsResending(true);
    try {
      // Call our custom dealer-otp function to resend the code
      const { data, error } = await supabase.functions.invoke('dealer-otp', {
        body: {
          action: 'generate',
          email: email.trim().toLowerCase()
        }
      });
      
      if (error || !data.success) {
        throw new Error(error?.message || data?.error || "Failed to resend code");
      }
      
      toast({
        title: "Code resent!",
        description: "A new code has been sent to your email.",
      });
      // We stay on the OTP step - no state change here
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Go back to email step without page reload
  const handleBackToEmail = () => {
    // Simply change the step - don't reset anything else
    setStep("email");
  };

  return {
    isLoading,
    isResending, // Expose the resending state
    otpForm,
    onOtpSubmit,
    handleResendOtp,
    handleBackToEmail,
    resetOtpForm: () => otpForm.reset({ otp: "" })
  };
}
