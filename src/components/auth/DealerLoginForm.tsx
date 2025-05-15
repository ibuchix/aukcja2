
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { LoginError } from "@/components/auth/login/LoginError";
import { LoginFormFields } from "@/components/auth/login/LoginFormFields";
import { LoginSubmitButton } from "@/components/auth/login/LoginSubmitButton";
import { AuthTroubleshooter } from "./AuthTroubleshooter";
import { clearAuthStorage } from "@/utils/auth-utils";
import { useToast } from "@/hooks/use-toast";

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const { 
    register, 
    handleSubmit, 
    onSubmit, 
    isLoading, 
    error, 
    errors,
    loginAttempted,
    diagnosticInfo,
    checkAuthDiagnostics
  } = useLoginForm(returnUrl);
  
  const { toast } = useToast();

  // Check for auth storage issues on component mount
  useEffect(() => {
    const authInfo = checkAuthDiagnostics();
    
    if (authInfo.hasLocalToken || authInfo.hasLocalDealerToken) {
      console.log("Found existing auth tokens, might cause conflicts");
    }
  }, []);

  // Export loginAttempted and error for parent component to use
  useEffect(() => {
    // Inform parent component about login attempt result
    return () => {
      console.log("Login form unmounting, attempted:", loginAttempted, "error:", error);
    };
  }, [loginAttempted, error]);
  
  // Function to handle clearing auth storage
  const handleClearAuthStorage = () => {
    clearAuthStorage();
    checkAuthDiagnostics();
    toast({
      title: "Auth storage cleared",
      description: "All authentication data has been cleared from your browser.",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <LoginError error={error} loginAttempted={loginAttempted} />}
      
      <LoginFormFields register={register} errors={errors} />
      
      <LoginSubmitButton isLoading={isLoading} />
      
      <div className="text-center text-sm mt-4">
        Don't have an account?{" "}
        <Link to="/auth?tab=register" className="text-primary hover:underline">
          Register here
        </Link>
      </div>
      
      {/* Add the AuthTroubleshooter component */}
      <AuthTroubleshooter />
    </form>
  );
}
