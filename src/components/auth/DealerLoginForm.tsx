
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { LoginError } from "@/components/auth/login/LoginError";
import { LoginFormFields } from "@/components/auth/login/LoginFormFields";
import { LoginSubmitButton } from "@/components/auth/login/LoginSubmitButton";
import { AuthTroubleshooter } from "./AuthTroubleshooter";
import { clearAuthStorage } from "@/utils/auth-utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { RefreshCcw } from "lucide-react";

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
  
  // Function to handle clearing auth storage
  const handleClearAuthStorage = () => {
    clearStorage();
    checkAuthDiagnostics();
    toast({
      title: "Auth storage cleared",
      description: "All authentication data has been cleared from your browser.",
    });
  };
  
  // Handle refresh token action
  const handleRefreshToken = async () => {
    try {
      // This will trigger a refresh in the useAuth context
      const response = await fetch('https://sdvakfhmoaoucmhbhwvy.supabase.co/auth/v1/token?grant_type=refresh_token', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"
        }
      });
      
      checkAuthDiagnostics(); // Re-check auth state
      
      toast({
        title: "Token refresh attempted",
        description: "Check console for details",
      });
    } catch (error) {
      console.error("Token refresh failed:", error);
      toast({
        title: "Token refresh failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

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
      
      <div className="border-t border-slate-200 pt-4 mt-4">
        <div className="flex flex-col sm:flex-row gap-2 text-sm">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleClearAuthStorage}
            className="text-xs"
          >
            Clear Auth Storage
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshToken}
            className="text-xs"
          >
            <RefreshCcw className="w-3 h-3 mr-1" /> Refresh Token
          </Button>
        </div>
      </div>
      
      <AuthTroubleshooter />
    </form>
  );
}
