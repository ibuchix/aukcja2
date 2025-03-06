
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

  // Handle email submit and send OTP with retries
  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    
    try {
      // Sanitize the email before submission
      const sanitizedEmail = values.email.trim().toLowerCase().replace(/[^a-zA-Z0-9@._+-]/g, '');
      
      if (sanitizedEmail !== values.email) {
        emailForm.setValue('email', sanitizedEmail);
        values.email = sanitizedEmail;
      }
      
      console.log("Initiating OTP sign-in for:", sanitizedEmail);
      
      // Try up to 3 times with exponential backoff
      let attempt = 0;
      let result = null;
      let lastError = null;
      
      while (attempt < 3 && !result?.success) {
        try {
          // Add delay for retries (0ms, 500ms, 1500ms)
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
            console.log(`Retry attempt ${attempt + 1} for OTP sign-in`);
          }
          
          result = await initiateOtpSignIn(sanitizedEmail);
          
          if (result.success) {
            break;
          } else {
            lastError = result.error;
            console.warn(`OTP sign-in attempt ${attempt + 1} failed:`, lastError);
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Unknown error";
          console.error(`OTP sign-in attempt ${attempt + 1} error:`, err);
        }
        
        attempt++;
      }
      
      if (result?.success) {
        console.log("OTP sign-in successful, transitioning to OTP step");
        // First set the email and reset OTP form
        setEmail(sanitizedEmail);
        resetOtpForm();
        
        // Then transition to OTP step - this should trigger showing the OTP form
        setStep("otp");
        
        toast({
          title: "Code sent!",
          description: "Check your email for the login code.",
        });
      } else {
        // Enhanced error handling for user-friendly messages
        let errorMessage = lastError || "Failed to send login code. Please try again.";
        console.error("OTP sign-in error:", errorMessage);
        
        // Provide more helpful messages for common errors
        if (errorMessage.includes("No account found") || 
            errorMessage.includes("doesn't exist") || 
            errorMessage.includes("not registered") ||
            errorMessage.includes("This email is not registered")) {
          errorMessage = "No account exists with this email. Please register first.";
        } else if (errorMessage.includes("Too many requests") || 
                  errorMessage.includes("rate limit")) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (errorMessage.includes("Signups not allowed")) {
          errorMessage = "This email is not registered. Please register first.";
        } else if (errorMessage.includes("Failed to send a request") ||
                  errorMessage.includes("network") ||
                  errorMessage.includes("connect")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
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
    emailForm,
    onEmailSubmit
  };
}
