
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { initiateOtpSignIn, verifyOtp } from "@/services/auth/signin";

// OTP validation schema - updated to properly validate numeric codes
const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 characters")
    .max(6, "OTP must be 6 characters")
    .regex(/^\d{6}$/, "OTP must contain 6 digits only")
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
    mode: "onChange", // Validate on change for better user feedback
  });

  // Handle OTP verification
  const onOtpSubmit = async (values: OtpFormValues) => {
    setIsLoading(true);
    try {
      // Ensure OTP is a clean string without spaces or non-digits
      const cleanOtp = values.otp.replace(/\D/g, '');
      
      const result = await verifyOtp(email, cleanOtp);
      
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
        // Reset OTP form when resending
        otpForm.reset({ otp: "" });
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
    // Reset OTP form when going back
    otpForm.reset({ otp: "" });
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
