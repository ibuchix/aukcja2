
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { initiateOtpSignIn } from "@/services/auth/signin";

// Email validation schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type EmailFormValues = z.infer<typeof emailSchema>;

export function useEmailForm(
  setStep: (step: "email" | "otp") => void,
  setEmail: (email: string) => void,
  resetOtpForm: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle email submit and send OTP
  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      const result = await initiateOtpSignIn(values.email);
      
      if (result.success) {
        setEmail(values.email);
        // Reset OTP form to ensure no previous values
        resetOtpForm();
        setStep("otp");
        toast({
          title: "Code sent!",
          description: "Check your email for the login code.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send login code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    emailForm,
    onEmailSubmit
  };
}
