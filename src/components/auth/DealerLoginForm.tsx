
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { initiateOtpSignIn, verifyOtp } from "@/services/auth/signin";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Email validation schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// OTP validation schema
const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 characters").max(6, "OTP must be 6 characters"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export function DealerLoginForm() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Handle email submit and send OTP
  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      const result = await initiateOtpSignIn(values.email);
      
      if (result.success) {
        setEmail(values.email);
        // Reset OTP form to ensure no previous values
        otpForm.reset({ otp: "" });
        setStep("otp");
        toast({
          title: "Code sent!",
          description: "Check your email for the login code.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send login code. Please try again.",
          variant: "destructive",
        });
      }
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

  // Handle OTP verification
  const onOtpSubmit = async (values: OtpFormValues) => {
    setIsLoading(true);
    try {
      const result = await verifyOtp(email, values.otp);
      
      if (result.success) {
        toast({
          title: "Login successful!",
          description: "Redirecting to your dashboard...",
        });
        navigate("/dealer/dashboard");
      } else {
        toast({
          title: "Invalid code",
          description: result.error || "The code you entered is invalid or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: "Failed to verify your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const result = await initiateOtpSignIn(email);
      
      if (result.success) {
        // Reset OTP form when resending
        otpForm.reset({ otp: "" });
        toast({
          title: "Code resent!",
          description: "A new code has been sent to your email.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resend code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to email step
  const handleBackToEmail = () => {
    setStep("email");
    // Reset both forms when going back
    otpForm.reset({ otp: "" });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Dealer Login</h3>
        <p className="text-sm text-muted-foreground">
          {step === "email" 
            ? "Enter your email to receive a login code" 
            : "Enter the code sent to your email"}
        </p>
      </div>

      {step === "email" ? (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <FormField
              control={emailForm.control}
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending code..." : "Send login code"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>One-Time Code</FormLabel>
                  <FormControl>
                    <InputOTP 
                      maxLength={6}
                      disabled={isLoading}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      pattern="[0-9]"
                    >
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify & Login"}
            </Button>
            
            <div className="flex justify-between pt-2 text-sm">
              <button 
                type="button" 
                onClick={handleBackToEmail} 
                className="text-primary underline"
                disabled={isLoading}
              >
                Use different email
              </button>
              <button 
                type="button" 
                onClick={handleResendOtp} 
                className="text-primary underline"
                disabled={isLoading}
              >
                Resend code
              </button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
