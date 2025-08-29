
import { useState, useEffect } from "react";
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

  // Listen for navigation away from auth page to clear loading state
  useEffect(() => {
    if (!location.pathname.includes('/auth') && isLoading) {
      console.log("🎯 Navigation away from auth page detected, clearing loading state");
      setIsLoading(false);
    }
  }, [location.pathname, isLoading]);

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
      console.log("📍 Current location during login:", location.pathname);
      
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
            errorMessage = "Wprowadź poprawny adres email.";
          }
        }
        
        setError(errorMessage);
        return;
      }

      console.log("✅ Login successful! Session set in Supabase client");
      console.log("🔄 useAuthStateListener will handle all navigation");
      
      // Show success toast
      toast({
        title: "Logowanie pomyślne",
        description: "Witamy ponownie!",
      });
      
      // Clear URL query parameters if present
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('tab')) {
        window.history.replaceState({}, '', currentUrl.pathname);
      }
      
      // Set up a timeout to clear loading state if navigation doesn't happen
      setTimeout(() => {
        if (window.location.pathname.includes('/auth')) {
          console.log("⚠️ Still on auth page after timeout, clearing loading state");
          setIsLoading(false);
        }
      }, 3000);
      
      console.log("🔄 Login form waiting for useAuthStateListener to handle navigation");
      
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

  // Provide a way for external components to clear loading state
  const clearLoadingState = () => {
    console.log("🧹 Externally clearing loading state");
    setIsLoading(false);
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
    clearStorage: clearAuthStorage,
    clearLoadingState
  };
}
