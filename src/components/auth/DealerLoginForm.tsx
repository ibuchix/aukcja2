
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
import { Loader2 } from "lucide-react";

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
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // Successfully logged in, redirect happens via the auth state change
      toast({
        title: "Login successful",
        description: "You have been signed in successfully.",
      });
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
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
          >
            Don't have an account? Sign up
          </Button>
        </p>
      </div>
    </div>
  );
}
