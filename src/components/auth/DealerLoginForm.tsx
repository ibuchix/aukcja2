
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LoginFormValues {
  email: string;
  password: string;
}

export function DealerLoginForm({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Login form submitted for:", data.email);
      
      // Normalize email for consistency
      const normalizedEmail = data.email.toLowerCase().trim();
      
      const { error: signInError } = await signIn({
        email: normalizedEmail,
        password: data.password,
        redirectTo: returnUrl,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        
        // Handle specific errors more user-friendly
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (signInError.message.includes("Email not found")) {
          setError("No account found with this email. Please check your email or register.");
        } else {
          setError(signInError.message);
        }
        
        toast({
          title: "Login failed",
          description: signInError.message,
          variant: "destructive",
        });
        
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // A successful login redirects automatically to returnUrl, no need for navigate here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Login error:", err);
      
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    </form>
  );
}
