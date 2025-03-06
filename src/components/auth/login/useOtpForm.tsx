import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useOtpForm(email: string, onBack: () => void) {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (value: string) => {
    setOtp(value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError("Please enter all 6 digits of your login code");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const { data, error } = await supabase.functions.invoke("dealer-otp", {
        body: {
          action: "verify-otp",
          email: email.trim().toLowerCase(),
          otp: otp
        }
      });
      
      if (error || !data?.success) {
        console.error("OTP verification failed:", error || data?.error);
        setError(data?.message || "Invalid verification code. Please try again.");
        return;
      }
      
      toast({
        title: "Verification successful",
        description: "You've been logged in successfully",
      });
      
      // Handle the case where dealer profile needs to be completed
      if (data.profileStatus === 'incomplete' || data.completionRequired) {
        // Redirect to profile completion page with user ID and email
        navigate('/complete-registration', { 
          state: { 
            userId: data.user?.id,
            email: data.user?.email 
          }
        });
        return;
      }
      
      // Check if we have an exchange token and use it
      if (data.exchangeToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.exchangeToken,
          refresh_token: data.exchangeToken
        });
        
        if (sessionError) {
          console.error("Session creation failed:", sessionError);
          setError("Failed to create session. Please try again.");
          return;
        }
      }
      
      // Redirect to dashboard on success
      navigate('/dealer/dashboard');
      
    } catch (err) {
      console.error("Error during OTP verification:", err);
      setError("Verification failed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    otp,
    isSubmitting,
    error,
    handleChange,
    handleSubmit,
  };
}
