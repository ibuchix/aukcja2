
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { normalizeEmail } from "@/utils/dealerProfileMapping";
import { getAuthDiagnostics, clearAuthStorage } from "@/utils/auth-utils";
import { signInWithEmail } from "@/services/auth/signin";

interface LoginFormValues {
  email: string;
  password: string;
}

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, unknown> | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track navigation to prevent race conditions
  const navigationTriggeredRef = useRef(false);

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
      navigationTriggeredRef.current = false;

      // Normalize email consistently
      const normalizedEmail = normalizeEmail(data.email);
      
      console.log("🚀 Starting login flow for:", normalizedEmail);
      
      // Get auth diagnostic info before attempt
      const beforeAuthInfo = getAuthDiagnostics();
      console.log("📊 Auth state before login attempt:", beforeAuthInfo);
      
      // Use signInWithEmail which handles session setting internally
      const result = await signInWithEmail({
        email: normalizedEmail,
        password: data.password.trim(),
      });
      
      if (result.error) {
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

      console.log("✅ Login successful! Navigation will be handled by auth state listener");
      
      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Clear URL query parameters if present
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('tab')) {
        window.history.replaceState({}, '', currentUrl.pathname);
      }
      
      // Let the auth state listener handle navigation - remove manual navigation
      // The useAuthStateListener will detect the SIGNED_IN event and navigate automatically
      console.log("🔄 Letting auth state listener handle navigation...");
      
      setIsLoading(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("❌ Login exception:", err);
      
      setError(errorMessage);
      setIsLoading(false);
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Update diagnostic info after exception
      setDiagnosticInfo(getAuthDiagnostics());
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
