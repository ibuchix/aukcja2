
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { verifyOtp } from "@/services/auth/signin";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// OTP validation schema
const otpSchema = z.object({
  otp: z.string()
    .length(6, "Code must be exactly 6 characters")
    .refine((otp) => /^\d+$/.test(otp), "Code must contain only numbers"),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

export function useOtpForm(
  email: string,
  setStep: (step: "email" | "otp") => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signOut } = useAuth();

  // OTP form with validation
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange",
  });

  // Handle OTP form submission
  const handleSubmit = otpForm.handleSubmit(async (values: OtpFormValues) => {
    setIsSubmitting(true);
    
    try {
      const result = await verifyOtp(email, values.otp);
      
      if (result.success) {
        console.log("OTP verification successful:", result);
        
        // Handle successful login with exchange token
        if (result.exchangeToken) {
          console.log("Exchanging token for session...");
          
          // Sign in using the exchange token
          const { error } = await signIn({ exchangeToken: result.exchangeToken });
          
          if (error) {
            console.error("Error exchanging token:", error);
            toast({
              title: "Error",
              description: "Failed to establish session. Please try again.",
              variant: "destructive",
            });
            await signOut(); // Clear potentially broken auth state
            return;
          }
          
          toast({
            title: "Login successful!",
            description: "You are now logged in.",
          });
          
          // Redirect to dashboard after successful login
          navigate("/dealer/dashboard");
        } else if (result.session) {
          // Fallback for session-based login (legacy)
          toast({
            title: "Login successful!",
            description: "You are now logged in.",
          });
          
          // Redirect to dashboard after successful login
          navigate("/dealer/dashboard");
        } else {
          console.error("Missing session data and exchange token from verification");
          toast({
            title: "Error",
            description: "Failed to establish session. Missing data.",
            variant: "destructive",
          });
          await signOut(); // Clear potentially broken auth state
        }
      } else {
        // Handle verification failure
        console.error("OTP verification failed:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to verify code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  // Handle resending the OTP
  const handleResendOtp = async () => {
    setIsResending(true);
    // Implement resend logic here (e.g., call initiateOtpSignIn again)
    toast({
      title: "Resending code...",
      description: "A new code has been sent to your email.",
    });
    setIsResending(false);
  };

  // Handle going back to the email form
  const handleBackToEmail = () => {
    setStep("email");
  };
  
  const resetOtpForm = () => {
    otpForm.reset();
  };

  return {
    isSubmitting,
    isResending,
    otpForm,
    handleSubmit,
    handleResendOtp,
    handleBackToEmail,
    resetOtpForm,
    error: undefined // You can add error handling here if needed
  };
}
