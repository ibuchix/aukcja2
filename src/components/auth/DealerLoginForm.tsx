
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Mail } from "lucide-react";
import { signInDealerWithEmail, initiateOtpSignIn, verifyOtp } from "@/services/auth/signin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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

const otpSchema = z.object({
  otp: z.string().min(6, {
    message: "OTP must be 6 digits",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export function DealerLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [otpMode, setOtpMode] = useState(false);
  const [activeEmail, setActiveEmail] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
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

  // Request OTP without password
  const requestOtp = async () => {
    setIsSubmitting(true);
    setLoginError(null);
    setWarningMessage(null);
    
    try {
      const email = activeEmail.trim().toLowerCase();
      console.log("Requesting OTP for:", email);
      
      const result = await initiateOtpSignIn(email);
      
      if (result.success) {
        toast({
          title: "OTP Sent",
          description: result.message,
        });
        return true;
      } else {
        setLoginError(result.error || "Failed to send OTP. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("OTP request error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to send OTP");
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
          description: "OTP verified successfully",
        });
        
        await checkSessionAndNavigate();
      } else {
        setLoginError(result.error || "Invalid OTP. Please check and try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setLoginError(null);
    setWarningMessage(null);
    
    try {
      const email = values.email.trim().toLowerCase();
      setActiveEmail(email); // Store the email for OTP flow
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

      // Check if OTP is required
      if (result.requiresOtp) {
        console.log("OTP required for authentication");
        setOtpMode(true);
        // Initiate OTP request
        await requestOtp();
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
        } else if (result.requiresOtp) {
          // This is handled above but adding as a safeguard
          setOtpMode(true);
          return;
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

  // Switch back to password entry
  const switchToPasswordMode = () => {
    setOtpMode(false);
    setLoginError(null);
    setWarningMessage(null);
  };

  return (
    <>
      {!otpMode ? (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
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
              control={loginForm.control}
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
              control={loginForm.control}
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
            <div className="text-center mt-4">
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => {
                  const email = loginForm.getValues().email;
                  if (email) {
                    setActiveEmail(email);
                    setOtpMode(true);
                    requestOtp();
                  } else {
                    loginForm.setError("email", {
                      message: "Please enter your email to receive an OTP"
                    });
                  }
                }}
              >
                Login with one-time password
              </Button>
            </div>
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
                ) : "Verify"}
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
              onClick={requestOtp}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send again"}
            </Button>
            <div className="pt-2">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm"
                onClick={switchToPasswordMode}
              >
                Back to password login
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
