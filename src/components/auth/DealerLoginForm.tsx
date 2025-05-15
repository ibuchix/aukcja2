
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { normalizeEmail } from "@/utils/dealerProfileMapping";
import { clearAuthStorage, getAuthDiagnostics } from "@/utils/auth-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthTroubleshooter } from "./AuthTroubleshooter";

interface LoginFormValues {
  email: string;
  password: string;
}

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, unknown> | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  // Check for auth storage issues on component mount
  useEffect(() => {
    const authInfo = getAuthDiagnostics();
    setDiagnosticInfo(authInfo);
    
    if (authInfo.hasLocalToken || authInfo.hasLocalDealerToken) {
      console.log("Found existing auth tokens, might cause conflicts");
    }
  }, []);

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
  
  // Function to handle clearing auth storage
  const handleClearAuthStorage = () => {
    clearAuthStorage();
    setDiagnosticInfo(getAuthDiagnostics());
    toast({
      title: "Auth storage cleared",
      description: "All authentication data has been cleared from your browser.",
    });
  };

  // Export loginAttempted and error for parent component to use
  useEffect(() => {
    // Inform parent component about login attempt result
    return () => {
      console.log("Login form unmounting, attempted:", loginAttempted, "error:", error);
    };
  }, [loginAttempted, error]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email" 
          placeholder="you@example.com"
          {...register("email", { 
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/password-reset" className="text-sm text-muted-foreground hover:text-primary">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : "Sign In"}
      </Button>
      
      <div className="text-center text-sm mt-4">
        Don't have an account?{" "}
        <Link to="/auth?tab=register" className="text-primary hover:underline">
          Register here
        </Link>
      </div>
      
      {/* Add the AuthTroubleshooter component */}
      <AuthTroubleshooter />
      
      {/* Show additional help if login failed */}
      {loginAttempted && error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Your password may have been saved with extra whitespace. Try typing your password manually instead of using autofill.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
