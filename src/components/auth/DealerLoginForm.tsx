
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { initiateOtpSignIn } from "@/services/auth/signin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.object({
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
});

type EmailFormValues = z.infer<typeof emailSchema>;

export function DealerLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [activeEmail, setActiveEmail] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
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

  // Set up auth state change monitoring
  useEffect(() => {
    // First check if there's an existing session
    checkSessionAndNavigate();

    // Then set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change in DealerLoginForm:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        navigate('/dealer/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Send Magic Link
  const sendMagicLink = async (email: string) => {
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log("Requesting Magic Link for:", trimmedEmail);
      
      const result = await initiateOtpSignIn(trimmedEmail);
      
      if (result.success) {
        setActiveEmail(trimmedEmail);
        setMagicLinkSent(true);
        toast({
          title: "Magic Link Sent",
          description: result.message || "Please check your email for the secure login link",
        });
        return true;
      } else {
        setLoginError(result.error || "Failed to send Magic Link. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Magic Link request error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to send Magic Link");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email submission
  async function onEmailSubmit(values: EmailFormValues) {
    const email = values.email.trim().toLowerCase();
    setActiveEmail(email);
    await sendMagicLink(email);
  }

  // Return to email entry
  const resetForm = () => {
    setMagicLinkSent(false);
    setLoginError(null);
    emailForm.reset();
  };

  return (
    <>
      {!magicLinkSent ? (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            <div className="text-center mb-4">
              <Mail className="w-12 h-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-medium">Log in to your account</h3>
              <p className="text-sm text-muted-foreground">
                Enter your email to receive a secure login link
              </p>
            </div>
            
            <FormField
              control={emailForm.control}
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
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending login link...
                </>
              ) : "Send login link"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-4">
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center mb-4">
            <Mail className="w-12 h-12 mx-auto text-primary mb-2" />
            <h3 className="text-lg font-medium">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a secure login link to<br />
              <span className="font-medium">{activeEmail}</span>
            </p>
          </div>
          
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="mb-2">
              <strong>Please note:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>The link will expire in 10 minutes</li>
              <li>Check your spam folder if you don't see the email</li>
              <li>Click the link in the email to complete your login</li>
            </ul>
          </div>
          
          <div className="text-center space-y-2 mt-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?
            </p>
            <Button
              type="button"
              variant="link"
              className="p-0 text-sm"
              onClick={() => sendMagicLink(activeEmail)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send again"}
            </Button>
            <div className="pt-2">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm"
                onClick={resetForm}
              >
                Use a different email
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Import React's useEffect hook at the top
import { useEffect } from "react";
