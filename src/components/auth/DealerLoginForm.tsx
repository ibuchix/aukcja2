
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { LoginError } from "@/components/auth/login/LoginError";
import { LoginFormFields } from "@/components/auth/login/LoginFormFields";
import { LoginSubmitButton } from "@/components/auth/login/LoginSubmitButton";
import { clearAuthStorage } from "@/utils/auth-utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const navigate = useNavigate();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    onSubmit, 
    isLoading, 
    error, 
    errors,
    loginAttempted,
    loginSuccess,
    diagnosticInfo,
    checkAuthDiagnostics
  } = useLoginForm(returnUrl);
  
  const { toast } = useToast();

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

  // Watch for successful login to ensure we redirect
  useEffect(() => {
    if (loginSuccess) {
      console.log("Login successful, redirecting to:", returnUrl);
      toast({
        title: "Login successful",
        description: "Redirecting to dashboard...",
      });
      navigate(returnUrl);
    }
  }, [loginSuccess, returnUrl, navigate, toast]);

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
      
      {loginSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>
            Login successful! Redirecting...
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-center text-sm mt-4">
        Don't have an account?{" "}
        <Link to="/auth?tab=register" className="text-primary hover:underline">
          Register here
        </Link>
      </div>
    </form>
  );
}
