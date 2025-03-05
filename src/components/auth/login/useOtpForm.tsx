
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { initiateOtpSignIn, verifyOtp } from "@/services/auth/signin";

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
  const { toast } = useToast();
  const navigate = useNavigate();

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Handle OTP verification
  const onOtpSubmit = async (values: OtpFormValues) => {
    setIsLoading(true);
    try {
      const result = await verifyOtp(email, values.otp);
      
      if (result.success) {
        toast({
          title: "Login successful!",
          description: "Redirecting to your dashboard...",
        });
        navigate("/dealer/dashboard");
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

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const result = await initiateOtpSignIn(email);
      
      if (result.success) {
        toast({
          title: "Code resent!",
          description: "A new code has been sent to your email.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resend code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to email step
  const handleBackToEmail = () => {
    setStep("email");
  };

  return {
    isLoading,
    setIsLoading,
    otpForm,
    onOtpSubmit,
    handleResendOtp,
    handleBackToEmail,
    resetOtpForm: () => otpForm.reset({ otp: "" })
  };
}
