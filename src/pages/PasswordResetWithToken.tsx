import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecureInput } from "@/components/ui/secure-input";
import { Button } from "@/components/ui/button";
import { PasswordValidation } from "@/components/auth/PasswordValidation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { confirmPasswordReset } from "@/services/auth/passwordReset";
import { ArrowLeft, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { generateStrongPassword } from "@/utils/passwordGenerator";
import { CloudflareTurnstile, CloudflareTurnstileRef } from "@/components/auth/CloudflareTurnstile";

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileRef>(null);

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
        title: "Nieprawidłowy link",
        description: "Ten link do resetowania hasła jest nieprawidłowy. Poproś o nowy.",
        variant: "destructive"
      });
      navigate("/auth");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, navigate, toast]);

  const handleGeneratePassword = () => {
    const generatedPassword = generateStrongPassword();
    form.setValue("newPassword", generatedPassword);
    form.setValue("confirmPassword", generatedPassword);
    setShowNewPassword(true);
    
    toast({
      title: "Hasło wygenerowane!",
      description: generatedPassword,
      duration: 10000,
    });
  };

  const onSubmit = async (data: PasswordResetForm) => {
    if (!token) {
      toast({
        title: "Błąd",
        description: "Nieprawidłowy token resetowania",
        variant: "destructive"
      });
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      form.setError("confirmPassword", {
        message: "Hasła nie pasują do siebie"
      });
      return;
    }

    if (data.newPassword.length < 12) {
      form.setError("newPassword", {
        message: "Hasło musi mieć co najmniej 12 znaków"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmPasswordReset(token, data.newPassword, turnstileToken || undefined);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Sukces!",
          description: "Twoje hasło zostało pomyślnie zresetowane.",
        });
        
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        toast({
          title: "Resetowanie nie powiodło się",
          description: result.error || "Nie można zresetować hasła. Link mógł wygasnąć.",
          variant: "destructive"
        });
        // Reset turnstile on error
        setTurnstileToken(null);
        turnstileRef.current?.reset();
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        variant: "destructive"
      });
      setTurnstileToken(null);
      turnstileRef.current?.reset();
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
            <CardTitle className="text-2xl">Hasło zostało zresetowane!</CardTitle>
            <CardDescription>
              Twoje hasło zostało zmienione. Możesz teraz zalogować się przy użyciu nowego hasła.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full"
            >
              Przejdź do logowania
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
          Wróć do logowania
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
            <CardDescription>
              Wprowadź poniżej swoje nowe hasło
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
                      <FormLabel>Nowe hasło</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <SecureInput 
                            type={showNewPassword ? "text" : "password"}
                            fieldType="password"
                            maxLength={72}
                            placeholder="Wprowadź nowe hasło"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtitle-text hover:text-body-text transition-colors"
                            tabIndex={-1}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordValidation 
                        password={form.watch("newPassword") || ""} 
                        className="mt-2"
                        onGeneratePassword={handleGeneratePassword}
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
                      <FormLabel>Potwierdź hasło</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <SecureInput 
                            type={showConfirmPassword ? "text" : "password"}
                            fieldType="password"
                            maxLength={72}
                            placeholder="Potwierdź nowe hasło"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtitle-text hover:text-body-text transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CloudflareTurnstile
                  ref={turnstileRef}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !turnstileToken}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Zresetuj hasło
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
