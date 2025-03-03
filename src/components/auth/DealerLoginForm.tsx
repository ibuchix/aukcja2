
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { signInDealerWithEmail } from "@/services/auth/signin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const loginFormSchema = z.object({
  email: z.string()
    .email({
      message: "Please enter a valid email address",
    })
    .min(5, {
      message: "Email must be at least 5 characters",
    })
    .max(255, {
      message: "Email cannot exceed 255 characters",
    }),
  password: z.string()
    .min(8, {
      message: "Password must be at least 8 characters",
    })
    .max(72, {
      message: "Password cannot exceed 72 characters",
    }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function DealerLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Function to check session and navigate if valid
  const checkSessionAndNavigate = async () => {
    const { data } = await supabase.auth.getSession();
    
    if (data?.session) {
      console.log("Valid session detected, navigating to dashboard");
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      
      setTimeout(() => {
        navigate('/dealer/dashboard');
      }, 500);
      
      return true;
    }
    
    return false;
  };

  // Simple direct login attempt
  const attemptDirectLogin = async (email: string, password: string) => {
    try {
      console.log("Attempting direct login");
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error && data.session) {
        console.log("Direct login successful");
        return true;
      }
      
      console.log("Direct login failed:", error?.message);
      return false;
    } catch (error) {
      console.error("Direct login threw exception:", error);
      return false;
    }
  };

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setLoginError(null);
    setWarningMessage(null);
    
    try {
      const email = values.email.trim().toLowerCase();
      console.log("Starting login process for:", email);
      
      // First try the direct approach (most reliable)
      const directLoginSuccessful = await attemptDirectLogin(email, values.password);
      
      if (directLoginSuccessful) {
        // Check if we have a valid session and navigate
        if (await checkSessionAndNavigate()) {
          return; // Login successful, we're done
        }
      }
      
      // If direct login didn't work, try the custom flow
      console.log("Direct login unsuccessful, trying custom authentication flow");
      const result = await signInDealerWithEmail(email, values.password);

      if (!result.success) {
        console.error("Login failed:", result.error);
        setLoginError(result.error || "Invalid credentials. Please check your email and password.");
        return;
      }

      // If we got a session back, try to set it
      if (result.session) {
        console.log("Custom login returned a session, setting it");
        
        try {
          // Store the session
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token
          });
          
          if (setSessionError) {
            console.error("Error setting session:", setSessionError);
            
            // Try a direct login one more time as a fallback
            console.log("Trying one more direct login as fallback");
            if (await attemptDirectLogin(email, values.password)) {
              if (await checkSessionAndNavigate()) {
                return; // Login successful via fallback
              }
            }
            
            setWarningMessage("Authenticated but session setup failed. Please try again.");
            return;
          }
          
          // Check if we now have a valid session
          if (await checkSessionAndNavigate()) {
            return; // Login successful after setting session
          }
          
          // If we're still here, something is wrong
          setWarningMessage("Session created but not detected by browser. Please try logging in again.");
        } catch (sessionError) {
          console.error("Session handling error:", sessionError);
          setWarningMessage("Login succeeded but there was an issue setting up your session. Please try again.");
        }
      } else {
        // Handle partial success case
        if (result.partialSuccess && result.warning) {
          setWarningMessage(result.warning);
          console.warn("Partial login success:", result.warning);
          
          // Try one more direct login
          console.log("Trying one final direct login attempt");
          if (await attemptDirectLogin(email, values.password)) {
            if (await checkSessionAndNavigate()) {
              return;
            }
          }
        } else {
          setLoginError("Authentication succeeded but no session was created. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        
        {warningMessage && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>{warningMessage}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="mail@example.com" {...field} />
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
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : "Login"}
        </Button>
      </form>
    </Form>
  );
}
