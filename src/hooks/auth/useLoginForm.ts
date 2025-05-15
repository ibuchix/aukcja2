
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { normalizeEmail } from "@/utils/dealerProfileMapping";
import { getAuthDiagnostics } from "@/utils/auth-utils";

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
  const { signIn } = useAuth();
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
      
      console.log("Login attempt for:", normalizedEmail);
      
      // Get auth diagnostic info before attempt
      const beforeAuthInfo = getAuthDiagnostics();
      console.log("Auth state before login attempt:", beforeAuthInfo);
      
      const result = await signIn({
        email: normalizedEmail,
        password: data.password.trim(),
      });

      if (!result.success) {
        console.error("Login error:", result.error);
        
        // Handle specific errors with user-friendly messages
        let errorMessage = result.error || "Authentication failed. Please check your credentials and try again.";
        
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
        
        // Don't redirect on error
        return;
      }

      // Success case
      console.log("Login successful, redirecting to:", returnUrl);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Handle successful login with navigation
      navigate(returnUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Login exception:", err);
      
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Update diagnostic info after exception
      setDiagnosticInfo(getAuthDiagnostics());
    } finally {
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
  };
}
