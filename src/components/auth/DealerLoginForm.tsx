
import { useEffect, useState } from "react";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { LoginError } from "@/components/auth/login/LoginError";
import { LoginFormFields } from "@/components/auth/login/LoginFormFields";
import { LoginSubmitButton } from "@/components/auth/login/LoginSubmitButton";
import { clearAuthStorage } from "@/utils/auth-utils";
import { Loader2 } from "lucide-react";

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    onSubmit, 
    isLoading, 
    error, 
    errors,
    loginAttempted,
    checkAuthDiagnostics
  } = useLoginForm();

  // Check for auth storage issues on component mount
  useEffect(() => {
    const authInfo = checkAuthDiagnostics();
    
    if (authInfo.hasLocalToken || authInfo.hasLocalDealerToken) {
      console.log("Found existing auth tokens, might cause conflicts");
      // Clear any problematic tokens that might cause authentication issues
      clearAuthStorage();
    }
    
    setAuthCheckComplete(true);
  }, []);

  if (!authCheckComplete) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <span>Checking authentication status...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <LoginError error={error} loginAttempted={loginAttempted} />}
      
      <LoginFormFields register={register} errors={errors} />
      
      <LoginSubmitButton isLoading={isLoading} />
      
      <div className="text-center text-sm mt-4">
        Don't have an account?{" "}
        <span className="text-primary cursor-pointer hover:underline">
          Switch to Register tab above
        </span>
      </div>
    </form>
  );
}
