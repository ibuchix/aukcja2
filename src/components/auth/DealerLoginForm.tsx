
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { LoginError } from "@/components/auth/login/LoginError";
import { LoginFormFields } from "@/components/auth/login/LoginFormFields";
import { LoginSubmitButton } from "@/components/auth/login/LoginSubmitButton";
import { AuthTroubleshooter } from "./AuthTroubleshooter";
import { clearAuthStorage } from "@/utils/auth-utils";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
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
    checkAuthDiagnostics,
    useDirectFetch,
    toggleFetchMethod,
    clearStorage
  } = useLoginForm(returnUrl);
  
  const { toast } = useToast();

  // Check for auth storage issues on component mount
  useEffect(() => {
    const authInfo = checkAuthDiagnostics();
    
    if (authInfo.hasLocalToken || authInfo.hasLocalDealerToken) {
      console.log("Found existing auth tokens, might cause conflicts");
    }
  }, []);

  // Watch for successful login to ensure we redirect
  useEffect(() => {
    if (loginSuccess) {
      console.log("Login successful, should redirect to:", returnUrl);
    }
  }, [loginSuccess, returnUrl]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <LoginError error={error} loginAttempted={loginAttempted} />}
      
      <LoginFormFields register={register} errors={errors} />
      
      <div className="flex items-center space-x-2 justify-end">
        <Switch
          id="fetch-method" 
          checked={true}
          disabled={true}
        />
        <Label htmlFor="fetch-method" className="text-xs text-muted-foreground">
          Using direct fetch (required)
        </Label>
      </div>
      
      <LoginSubmitButton isLoading={isLoading} />
      
      <div className="text-center text-sm mt-4">
        Don't have an account?{" "}
        <Link to="/auth?tab=register" className="text-primary hover:underline">
          Register here
        </Link>
      </div>
      
      <AuthTroubleshooter />
    </form>
  );
}
