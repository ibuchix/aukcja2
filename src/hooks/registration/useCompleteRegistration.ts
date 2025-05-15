
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/components/ui/use-toast";
import { handleAuthError } from "@/utils/supabase/authErrorHandler";
import { handleDatabaseError } from "@/utils/supabase/databaseErrorHandler";
import { OperationResult, SupabaseErrorUnion } from "@/utils/supabase/errorTypes";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const completeRegistration = async (formData: DealerFormValues): Promise<OperationResult<boolean>> => {
    try {
      setIsSubmitting(true);
      setError(null);
      setErrors([]);
      
      // Extract email from form data
      const { email } = formData;
      
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        const errorMsg = "Verification token is missing. Please check your email link.";
        setError(errorMsg);
        setErrors([errorMsg]);
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return { success: false, error: { 
          type: 'auth_general', 
          code: 'auth/missing-token',
          message: errorMsg
        }};
      }
      
      // Validate the token and complete registration
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      
      if (error) {
        const authError = handleAuthError(error);
        setError(authError.message);
        setErrors([authError.message]);
        toast({
          title: "Verification Failed",
          description: authError.message,
          variant: "destructive",
        });
        return { success: false, error: authError };
      }
      
      if (data?.user) {
        setIsSuccess(true);
        toast({
          title: "Registration Complete",
          description: "Your account has been successfully verified. You can now log in.",
          variant: "default",
        });
        return { success: true, data: true };
      } else {
        const errorMsg = "Verification succeeded but user data was not returned";
        setError(errorMsg);
        setErrors([errorMsg]);
        toast({
          title: "Registration Error",
          description: "Verification succeeded but something went wrong. Please try logging in.",
          variant: "destructive",
        });
        return { 
          success: false, 
          error: { 
            type: 'auth_general',
            code: 'auth/incomplete_verification',
            message: errorMsg
          } 
        };
      }
    } catch (error) {
      console.error("Registration completion error:", error);
      const dbError = handleDatabaseError(error);
      const errorMsg = dbError.message;
      setError(errorMsg);
      setErrors([errorMsg]);
      toast({
        title: "Registration Error",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false, error: dbError };
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetState = () => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
    setErrors([]);
  };

  // Add this utility function to clear auth tokens
  const clearAuthTokens = () => {
    try {
      // Clear all auth related tokens
      localStorage.removeItem('dealer_auth_token');
      localStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
      
      // Also try to clear any session
      supabase.auth.signOut({ scope: 'local' });
      
      toast({
        title: "Auth Storage Cleared",
        description: "Authentication tokens have been cleared. Please try logging in again.",
      });
      
      return true;
    } catch (error) {
      console.error("Error clearing auth storage:", error);
      toast({
        title: "Error Clearing Storage",
        description: "Failed to clear authentication storage. Try refreshing the page.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isSubmitting,
    isSuccess,
    error,
    errors,
    completeRegistration,
    resetState,
    clearAuthTokens // Export the new function
  };
}
