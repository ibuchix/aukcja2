
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { normalizeEmail } from "@/utils/dealerProfileMapping";
import { getAuthDiagnostics, clearAuthStorage } from "@/utils/auth-utils";
import { signInWithEmail } from "@/services/auth/signin";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormValues {
  email: string;
  password: string;
}

export function useLoginForm(returnUrl: string = "/dealer/dashboard") {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, unknown> | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuth();
  const { toast } = useToast();
  
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loginSuccessRef = useRef(false);

  // Check auth diagnostics
  const checkAuthDiagnostics = () => {
    const authInfo = getAuthDiagnostics();
    setDiagnosticInfo(authInfo);
    return authInfo;
  };

  // Effect to handle navigation after successful login
  useEffect(() => {
    if (loginSuccessRef.current && isAuthenticated && isInitialized && !isLoading) {
      console.log("✅ Auth context updated after login, navigating to dashboard");
      
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      // Clear URL query parameters and navigate
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('tab')) {
        window.history.replaceState({}, '', currentUrl.pathname);
      }
      
      navigate(returnUrl, { replace: true });
      loginSuccessRef.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized, isLoading, navigate, returnUrl]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setLoginAttempted(true);
      loginSuccessRef.current = false;

      // Normalize email consistently
      const normalizedEmail = normalizeEmail(data.email);
      
      console.log("🚀 Starting login flow for:", normalizedEmail);
      
      // Get auth diagnostic info before attempt
      const beforeAuthInfo = getAuthDiagnostics();
      console.log("📊 Auth state before login attempt:", beforeAuthInfo);
      
      // Use direct method 
      const result = await signInWithEmail({
        email: normalizedEmail,
        password: data.password.trim(),
      });
      
      const success = !result.error;

      if (!success) {
        console.error("❌ Login error:", result.error);
        setIsLoading(false);
        
        // Handle specific errors with user-friendly messages
        let errorMessage = result.error?.message || "Authentication failed. Please check your credentials and try again.";
        
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes("Invalid login credentials")) {
            errorMessage = "Incorrect email or password. Please try again.";
          } else if (errorMessage.includes("Email not found")) {
            errorMessage = "No account found with this email. Please check your email or register.";
          } else if (errorMessage.includes("Invalid email")) {
            errorMessage = "Please enter a valid email address.";
          }
        }
        
        setError(errorMessage);
        return;
      }

      console.log("✅ Login successful! Setting session in Supabase client...");
      
      // Set the session in Supabase client to trigger auth state change
      if (result.data?.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token
        });
        
        if (sessionError) {
          console.error("❌ Error setting session:", sessionError);
          throw sessionError;
        }
        
        console.log("✅ Session set successfully, waiting for auth context to update...");
        
        // Mark login as successful and wait for auth context to update
        loginSuccessRef.current = true;
        
        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        // Set a timeout as fallback in case auth context doesn't update
        navigationTimeoutRef.current = setTimeout(() => {
          console.warn("⚠️ Auth context didn't update in time, forcing navigation");
          
          // Clear URL query parameters and navigate
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.has('tab')) {
            window.history.replaceState({}, '', currentUrl.pathname);
          }
          
          navigate(returnUrl, { replace: true });
          loginSuccessRef.current = false;
          setIsLoading(false);
        }, 3000);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("❌ Login exception:", err);
      
      setError(errorMessage);
      setIsLoading(false);
      loginSuccessRef.current = false;
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Update diagnostic info after exception
      setDiagnosticInfo(getAuthDiagnostics());
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return {
    register,
    handleSubmit,
    onSubmit,
    isLoading,
    error,
    errors,
    loginAttempted,
    diagnosticInfo,
    checkAuthDiagnostics,
    setError,
    clearStorage: clearAuthStorage
  };
}
