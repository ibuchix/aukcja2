
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/components/ui/use-toast";
import { handleAuthError } from "@/utils/supabase/authErrorHandler";
import { handleDatabaseError } from "@/utils/supabase/databaseErrorHandler";
import { OperationResult } from "@/utils/supabase/errorTypes";
import { supabase } from "@/integrations/supabase/client";

export function useCompleteRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeRegistration = async (
    email: string,
    password: string,
    token: string
  ): Promise<OperationResult<boolean>> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate the token and complete registration
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      
      if (error) {
        const authError = handleAuthError(error);
        setError(authError.message);
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
        setError("Verification succeeded but user data was not returned");
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
            message: "Verification succeeded but user data was not returned"
          } 
        };
      }
    } catch (error) {
      console.error("Registration completion error:", error);
      const dbError = handleDatabaseError(error);
      setError(dbError.message);
      toast({
        title: "Registration Error",
        description: dbError.message,
        variant: "destructive",
      });
      return { success: false, error: dbError };
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetState = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  };

  return {
    isLoading,
    isSuccess,
    error,
    completeRegistration,
    resetState
  };
}
