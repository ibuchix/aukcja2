
import { Link } from "react-router-dom";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormFieldsProps {
  register: UseFormRegister<LoginFormValues>;
  errors: FieldErrors<LoginFormValues>;
}

export function LoginFormFields({ register, errors }: LoginFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email" 
          placeholder="użytkownik@email.com"
          {...register("email", { 
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Wprowadź poprawny adres e-mail"
            }
          })}
        />
        {errors.email && (
          <p className="text-sm text-[#D81B24]">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Hasło</Label>
          <Link to="/request-password-reset" className="text-sm text-white/70 hover:text-[#D81B24]">
            Nie pamiętasz hasła?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <p className="text-sm text-[#D81B24]">{errors.password.message}</p>
        )}
      </div>
    </>
  );
}
