
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
        return;
      }

      // Handle partial success case (authenticated but profile issues)
      if (result.partialSuccess && result.warning) {
        setWarningMessage(result.warning);
        console.warn("Partial login success:", result.warning);
      }

      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      
      // Navigate to dashboard
      navigate('/dealer/dashboard');

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
