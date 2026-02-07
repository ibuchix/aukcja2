
import { useEffect, useRef, useState } from "react";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { LoginError } from "@/components/auth/login/LoginError";
import { LoginFormFields } from "@/components/auth/login/LoginFormFields";
import { LoginSubmitButton } from "@/components/auth/login/LoginSubmitButton";
import { clearAuthStorage } from "@/utils/auth-utils";
import { CloudflareTurnstile, CloudflareTurnstileRef } from "@/components/auth/CloudflareTurnstile";
import { Loader2 } from "lucide-react";

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileRef>(null);
  
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
      clearAuthStorage();
    }
    
    setAuthCheckComplete(true);
  }, []);

  const handleFormSubmit = async (data: { email: string; password: string }) => {
    await onSubmit(data, turnstileToken);
    // Reset turnstile after submission
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  if (!authCheckComplete) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <span>Checking authentication status...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && <LoginError error={error} loginAttempted={loginAttempted} />}
      
      <LoginFormFields register={register} errors={errors} />
      
      <CloudflareTurnstile
        ref={turnstileRef}
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />
      
      <LoginSubmitButton isLoading={isLoading} disabled={!turnstileToken} />
      
      <div className="text-center text-sm mt-2">
        <a 
          href="/request-password-reset" 
          className="text-primary hover:underline"
        >
          Zapomniałeś hasła?
        </a>
      </div>
      
      <div className="text-center text-sm mt-4">
        Nie masz konta?{" "}
        <span className="text-primary cursor-pointer hover:underline">
          Przejdź do zakładki rejestracji powyżej
        </span>
      </div>
    </form>
  );
}
