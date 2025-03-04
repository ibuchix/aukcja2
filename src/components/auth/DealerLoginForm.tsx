
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
import { initiateOtpSignIn, verifyOtp } from "@/services/auth/signin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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

const otpSchema = z.object({
  otp: z.string().min(6, {
    message: "OTP must be 6 digits",
  }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export function DealerLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [activeEmail, setActiveEmail] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
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

  // Request OTP
  const requestOtp = async (email: string) => {
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log("Requesting OTP for:", trimmedEmail);
      
      const result = await initiateOtpSignIn(trimmedEmail);
      
      if (result.success) {
        setActiveEmail(trimmedEmail);
        setOtpSent(true);
        toast({
          title: "Verification Code Sent",
          description: result.message || "Please check your email for the login code",
        });
        return true;
      } else {
        setLoginError(result.error || "Failed to send verification code. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("OTP request error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to send verification code");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP submission
  async function onOtpSubmit(values: OtpFormValues) {
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      console.log("Verifying OTP for:", activeEmail);
      
      const result = await verifyOtp(activeEmail, values.otp);
      
      if (result.success && result.session) {
        toast({
          title: "Login Successful",
          description: "Verification successful",
        });
        
        await checkSessionAndNavigate();
      } else {
        setLoginError(result.error || "Invalid verification code. Please check and try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to verify code");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle email submission
  async function onEmailSubmit(values: EmailFormValues) {
    const email = values.email.trim().toLowerCase();
    setActiveEmail(email);
    await requestOtp(email);
  }

  // Return to email entry
  const returnToEmailEntry = () => {
    setOtpSent(false);
    setLoginError(null);
  };

  return (
    <>
      {!otpSent ? (
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
                Enter your email to receive a verification code
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
                  Sending code...
                </>
              ) : "Send verification code"}
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
            <h3 className="text-lg font-medium">Enter verification code</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit code to<br /><span className="font-medium">{activeEmail}</span>
            </p>
          </div>
          
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="mx-auto max-w-[360px]">
                    <FormControl>
                      <InputOTP maxLength={6} {...field} className="mx-auto justify-center">
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
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
                    Verifying...
                  </>
                ) : "Verify & Login"}
              </Button>
            </form>
          </Form>
          
          <div className="text-center space-y-2 mt-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="link"
              className="p-0 text-sm"
              onClick={() => requestOtp(activeEmail)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send again"}
            </Button>
            <div className="pt-2">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm"
                onClick={returnToEmailEntry}
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
