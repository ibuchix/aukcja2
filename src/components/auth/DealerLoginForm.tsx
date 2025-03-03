
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

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setLoginError(null);
    setWarningMessage(null);
    
    try {
      console.log("Attempting login with email:", values.email);
      const result = await signInDealerWithEmail(values.email, values.password);

      if (!result.success) {
        console.error("Login failed:", result.error);
        setLoginError(result.error || "Invalid credentials. Please check your email and password.");
        setIsSubmitting(false);
        return;
      }

      // Check if we got a session back
      if (result.session) {
        console.log("Login successful, got session:", result.session.user.id);
        
        try {
          // Store the session
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token
          });
          
          if (setSessionError) {
            console.error("Error setting session:", setSessionError);
            setWarningMessage("Authenticated but session setup failed. Please try again.");
            setIsSubmitting(false);
            return;
          }
          
          // Verify the session was set correctly
          const { data: currentSession } = await supabase.auth.getSession();
          console.log("Current session after login:", currentSession?.session?.user?.id);
          
          if (!currentSession?.session) {
            // Final fallback - try sign in with email/password one last time
            // This is sometimes necessary due to cookie handling
            await supabase.auth.signInWithPassword({
              email: values.email,
              password: values.password,
            });
          }
          
          toast({
            title: "Login Successful",
            description: "Redirecting to dashboard...",
          });
          
          // Navigate to dashboard with a slight delay to ensure session is processed
          setTimeout(() => {
            navigate('/dealer/dashboard');
          }, 800);
        } catch (sessionError) {
          console.error("Session handling error:", sessionError);
          setWarningMessage("Login succeeded but there was an issue setting up your session. Please try again.");
        }
      } else {
        // Handle partial success case
        if (result.partialSuccess && result.warning) {
          setWarningMessage(result.warning);
          console.warn("Partial login success:", result.warning);
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
