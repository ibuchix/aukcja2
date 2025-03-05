import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { initiateOtpSignIn } from "@/services/auth/signin";

// Enhanced email validation schema
const emailSchema = z.object({
  email: z.string()
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email cannot exceed 100 characters")
    .email("Please enter a valid email address")
    .refine(
      (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
      { message: "Please enter a valid email format" }
    )
});

export type EmailFormValues = z.infer<typeof emailSchema>;

export function useEmailForm(
  setStep: (step: "email" | "otp") => void,
  setEmail: (email: string) => void,
  resetOtpForm: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Email form with enhanced validation
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange" // Validate on change for immediate feedback
  });

  // Handle email submit and send OTP
  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      // Sanitize the email one more time before submission
      const sanitizedEmail = values.email.trim().toLowerCase().replace(/[^a-zA-Z0-9@._+-]/g, '');
      
      if (sanitizedEmail !== values.email) {
        emailForm.setValue('email', sanitizedEmail);
        values.email = sanitizedEmail;
      }
      
      const result = await initiateOtpSignIn(sanitizedEmail);
      
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
