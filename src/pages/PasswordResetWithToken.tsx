import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecureInput } from "@/components/ui/secure-input";
import { Button } from "@/components/ui/button";
import { PasswordValidation } from "@/components/auth/PasswordValidation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { confirmPasswordReset } from "@/services/auth/passwordReset";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface PasswordResetForm {
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordResetWithToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const form = useForm<PasswordResetForm>({
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast({
        title: "Invalid Link",
        description: "This password reset link is invalid. Please request a new one.",
        variant: "destructive"
      });
      navigate("/auth");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, navigate, toast]);

  const onSubmit = async (data: PasswordResetForm) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive"
      });
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      form.setError("confirmPassword", {
        message: "Passwords do not match"
      });
      return;
    }

    if (data.newPassword.length < 8) {
      form.setError("newPassword", {
        message: "Password must be at least 8 characters"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmPasswordReset(token, data.newPassword);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Success!",
          description: "Your password has been reset successfully.",
        });
        
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        toast({
          title: "Reset Failed",
          description: result.error || "Unable to reset password. The link may have expired.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
            <CardDescription>
              Your password has been changed. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/auth" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <SecureInput 
                          type="password"
                          fieldType="password"
                          maxLength={72}
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <PasswordValidation 
                        password={form.watch("newPassword") || ""} 
                        className="mt-2"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <SecureInput 
                          type="password"
                          fieldType="password"
                          maxLength={72}
                          placeholder="Confirm new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
