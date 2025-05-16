
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
    checkAuthDiagnostics,
    useDirectFetch,
    toggleFetchMethod
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
  
  // Handle debug action button click
  const handleDebugAction = async () => {
    try {
      const response = await fetch('https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/dealer-auth', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M`,
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M",
        },
        body: JSON.stringify({
          action: "debug",
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      console.log("Debug endpoint response:", data);
      
      toast({
        title: "Debug info",
        description: "See console for details",
      });
    } catch (error) {
      console.error("Debug action failed:", error);
      toast({
        title: "Debug failed",
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
          checked={useDirectFetch}
          onCheckedChange={toggleFetchMethod}
        />
        <Label htmlFor="fetch-method" className="text-xs text-muted-foreground">
          Use direct fetch {useDirectFetch ? "(enabled)" : "(disabled)"}
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
            onClick={handleDebugAction}
            className="text-xs"
          >
            Test Debug Endpoint
          </Button>
        </div>
      </div>
      
      {/* Add the AuthTroubleshooter component */}
      <AuthTroubleshooter />
    </form>
  );
}
