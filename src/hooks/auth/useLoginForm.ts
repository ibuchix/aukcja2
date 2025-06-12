
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { normalizeEmail } from "@/utils/dealerProfileMapping";
import { getAuthDiagnostics, clearAuthStorage } from "@/utils/auth-utils";
import { signInWithEmail } from "@/services/auth/signin";

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
  const { refreshSession, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Check auth diagnostics
  const checkAuthDiagnostics = () => {
    const authInfo = getAuthDiagnostics();
    setDiagnosticInfo(authInfo);
    return authInfo;
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setLoginAttempted(true);

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

      console.log("✅ Login successful! Waiting for auth context to sync...");
      
      // Show success toast immediately
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Wait for auth context to acknowledge the sign-in with timeout
      let authCheckAttempts = 0;
      const maxAuthChecks = 15; // 3 seconds total
      
      const waitForAuthSync = () => {
        return new Promise<void>((resolve) => {
          const checkAuth = () => {
            authCheckAttempts++;
            
            if (isAuthenticated && user) {
              console.log("✅ Auth context synced, navigating...");
              resolve();
              return;
            }
            
            if (authCheckAttempts >= maxAuthChecks) {
              console.log("⚠️ Auth sync timeout, proceeding with navigation anyway");
              resolve();
              return;
            }
            
            setTimeout(checkAuth, 200);
          };
          
          checkAuth();
        });
      };
      
      // Wait for auth sync or timeout
      await waitForAuthSync();
      
      // Force a session refresh (but don't wait for it to complete)
      refreshSession().catch(refreshErr => {
        console.warn("⚠️ Could not refresh session after login:", refreshErr);
        // Don't fail here since login was successful
      });
      
      // Clear any auth query parameters and navigate
      console.log("🧭 Navigating to:", returnUrl);
      
      if (window.location.search.includes('tab=login')) {
        // Clear the query parameters by replacing the current history entry
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      navigate(returnUrl, { replace: true });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("❌ Login exception:", err);
      
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Update diagnostic info after exception
      setDiagnosticInfo(getAuthDiagnostics());
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

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
