
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

export interface OtpFormValues {
  otp: string;
}

export function useOtpForm(email: string, setStep: (step: "email" | "otp") => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize the form with react-hook-form
  const otpForm = useForm<OtpFormValues>({
    defaultValues: {
      otp: ""
    }
  });

  const resetOtpForm = () => {
    otpForm.reset();
    setError("");
  };

  const handleBackToEmail = () => {
    resetOtpForm();
    setStep("email");
  };

  const handleResendOtp = async () => {
    if (isResending) return;
    
    setIsResending(true);
    setError("");
    
    try {
      const { data, error } = await supabase.functions.invoke("dealer-otp", {
        body: {
          action: "generate",
          email: email.trim().toLowerCase()
        }
      });
      
      if (error || !data?.success) {
        console.error("OTP generation failed:", error || data?.error);
        setError(data?.message || "Failed to send verification code. Please try again.");
        return;
      }
      
      toast({
        title: "Verification Code Sent",
        description: "A new verification code has been sent to your email",
      });
      
    } catch (err) {
      console.error("Error during OTP generation:", err);
      setError("Failed to send verification code. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the current OTP value from the form
    const otpValue = otpForm.getValues().otp;
    
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits of your login code");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      console.log("Verifying OTP:", email, otpValue);
      const { data, error } = await supabase.functions.invoke("dealer-otp", {
        body: {
          action: "verify",
          email: email.trim().toLowerCase(),
          otp: otpValue
        }
      });
      
      if (error || !data?.success) {
        console.error("OTP verification failed:", error || data?.error);
        setError(data?.message || "Invalid verification code. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Handle the case where dealer profile needs to be completed
      if (data.profileStatus === 'incomplete' || data.completionRequired) {
        // Redirect to profile completion page with user ID and email
        navigate('/complete-registration', { 
          state: { 
            userId: data.user?.id,
            email: data.user?.email 
          }
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check if we have both tokens and use them to create a session
      if (data.accessToken && data.refreshToken) {
        console.log("Creating session with auth tokens");
        
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.accessToken,
            refresh_token: data.refreshToken
          });
          
          if (sessionError) {
            console.error("Session creation failed:", sessionError);
            setError("Failed to create session. Please try again.");
            setIsSubmitting(false);
            return;
          }
          
          console.log("Session created successfully");
          
          toast({
            title: "Verification successful",
            description: "You've been logged in successfully",
          });
          
          // Only redirect after confirming successful session creation
          // Add a small delay to allow session to be fully established
          setTimeout(() => {
            navigate('/dealer/dashboard');
          }, 300);
          
        } catch (sessionErr) {
          console.error("Error during session creation:", sessionErr);
          setError("Failed to create session. Please try again.");
          setIsSubmitting(false);
        }
      } else {
        console.error("Missing tokens for session creation", {
          hasAccessToken: !!data.accessToken,
          hasRefreshToken: !!data.refreshToken
        });
        setError("Authentication failed. Please try again.");
        setIsSubmitting(false);
      }
      
    } catch (err) {
      console.error("Error during OTP verification:", err);
      setError("Verification failed. Please try again later.");
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isResending,
    error,
    otpForm,
    handleSubmit,
    handleResendOtp,
    handleBackToEmail,
    resetOtpForm
  };
}
