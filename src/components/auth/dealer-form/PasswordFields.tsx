
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SecureInput } from "@/components/ui/secure-input";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { PasswordValidation } from "@/components/auth/PasswordValidation";
import { generateStrongPassword } from "@/utils/passwordGenerator";
import { useToast } from "@/hooks/use-toast";

interface PasswordFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function PasswordFields({ form }: PasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleGeneratePassword = () => {
    const generatedPassword = generateStrongPassword();
    form.setValue("password", generatedPassword);
    form.setValue("confirmPassword", generatedPassword);
    setShowPassword(true);
    
    toast({
      title: "Hasło wygenerowane!",
      description: generatedPassword,
      duration: 10000,
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hasło</FormLabel>
            <FormControl>
              <div className="relative">
                <SecureInput
                  fieldType="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 12 znaków, jedna duża litera, jedna cyfra i jeden znak specjalny."
                  {...field}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">
                {showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              </span>
                </Button>
              </div>
            </FormControl>
            <PasswordValidation 
              password={form.watch("password") || ""} 
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
                  fieldType="password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Potwierdź hasło"
                  {...field}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">
                {showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
              </span>
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
