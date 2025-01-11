import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError } from "@supabase/supabase-js";

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const getErrorMessage = (error: AuthError) => {
  if (error.message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  return error.message;
};

export function DealerLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      setAuthError("");

      console.log("Attempting login with email:", values.email.trim().toLowerCase());
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (error) {
        console.error("Login error:", error);
        setAuthError(getErrorMessage(error));
        return;
      }

      if (data?.user) {
        // Check if dealer profile exists
        const { data: dealerProfile, error: dealerError } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (dealerError) {
          console.error("Error fetching dealer profile:", dealerError);
          setAuthError("Failed to verify dealer profile. Please try again.");
          return;
        }

        if (!dealerProfile) {
          console.error("No dealer profile found");
          setAuthError("No dealer profile found for this account. Please register as a dealer first.");
          await supabase.auth.signOut();
          return;
        }

        navigate('/dealer/dashboard');
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      setAuthError("An unexpected error occurred during login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
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
                  <Input type="email" {...field} />
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
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>
    </>
  );
}