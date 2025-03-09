
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Login form validation schema
const loginSchema = z.object({
  email: z.string()
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email cannot exceed 100 characters")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function DealerLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange"
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const { email, password } = values;
      console.log(`Attempting to sign in with email: ${email.substring(0, 3)}...`);
      
      const { error } = await signIn({ 
        email, 
        password,
        redirectTo: "/dealer/dashboard" 
      });
      
      if (error) {
        console.error("Login error:", error);
        
        let errorMessage = "Failed to sign in. Please check your credentials.";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email before logging in.";
        }
        
        setLoginError(errorMessage);
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      // Successfully logged in, redirect happens via the auth state change
      setLoginError(null);
      toast({
        title: "Login successful",
        description: "You have been signed in successfully.",
      });
      
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setLoginError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Dealer Login</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to access your account
        </p>
      </div>
      
      {loginError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your@email.com" 
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    className={form.formState.errors.email ? "border-red-500" : ""}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={form.formState.errors.password ? "border-red-500" : ""}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          <Button 
            variant="link" 
            className="p-0 h-auto" 
            onClick={() => navigate("/auth?tab=register")}
            disabled={isLoading}
          >
            Don't have an account? Sign up
          </Button>
        </p>
      </div>
    </div>
  );
}
