import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { PasswordValidation } from "../PasswordValidation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PersonalInfoFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function PersonalInfoFields({ form }: PersonalInfoFieldsProps) {
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formatPhoneNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    
    let formattedNumber = '';
    
    if (value.startsWith('+')) {
      formattedNumber = '+';
      
      if (digitsOnly.length > 0) {
        const countryCode = digitsOnly.substring(0, Math.min(3, digitsOnly.length));
        formattedNumber += countryCode;
        
        if (digitsOnly.length > 3) {
          formattedNumber += ' ';
          
          const firstPart = digitsOnly.substring(3, Math.min(6, digitsOnly.length));
          formattedNumber += firstPart;
          
          if (digitsOnly.length > 6) {
            formattedNumber += ' ';
            
            const secondPart = digitsOnly.substring(6, Math.min(9, digitsOnly.length));
            formattedNumber += secondPart;
            
            if (digitsOnly.length > 9) {
              formattedNumber += ' ';
              
              formattedNumber += digitsOnly.substring(9);
            }
          }
        }
      }
    } else {
      if (digitsOnly.length <= 3) {
        formattedNumber = digitsOnly;
      } else if (digitsOnly.length <= 6) {
        formattedNumber = `${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3)}`;
      } else if (digitsOnly.length <= 9) {
        formattedNumber = `${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3, 6)} ${digitsOnly.substring(6)}`;
      } else {
        formattedNumber = `${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3, 6)} ${digitsOnly.substring(6, 9)} ${digitsOnly.substring(9)}`;
      }
      
      if (formattedNumber.length > 0) {
        formattedNumber = '+' + formattedNumber;
      }
    }
    
    return formattedNumber;
  };

  const normalizePhoneNumber = (formattedNumber: string) => {
    return formattedNumber.replace(/[^\d+]/g, '');
  };

  useEffect(() => {
    const currentPhoneNumber = form.getValues("phoneNumber");
    if (!currentPhoneNumber) {
      form.setValue("phoneNumber", "+");
    }
  }, [form]);

  return (
    <>
      <FormField
        control={form.control}
        name="supervisorName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name of Account Supervisor</FormLabel>
            <FormControl>
              <Input {...field} onBlur={field.onBlur} disabled={form.formState.isSubmitting} />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Enter your full legal name as it appears on official documents
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              Email
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    Use a valid business email for verification purposes
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormLabel>
            <FormControl>
              <Input 
                type="email" 
                {...field} 
                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                disabled={form.formState.isSubmitting}
                aria-describedby="email-description"
                onBlur={(e) => {
                  field.onBlur();
                  if (e.target.value) {
                    form.setValue("email", e.target.value.trim());
                  }
                }}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground" id="email-description">
              This will be your login email
            </FormDescription>
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
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    setPasswordValue(e.target.value);
                  }}
                  disabled={form.formState.isSubmitting}
                  className="pr-10" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <PasswordValidation password={passwordValue} />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="+48 XXX XXX XXX" 
                disabled={form.formState.isSubmitting}
                value={field.value}
                onChange={(e) => {
                  const formattedValue = formatPhoneNumber(e.target.value);
                  field.onChange(formattedValue);
                }}
                onBlur={(e) => {
                  field.onBlur();
                  const normalizedValue = normalizePhoneNumber(field.value);
                  if (normalizedValue !== field.value) {
                    field.onChange(normalizedValue);
                  }
                }}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Include country code (e.g., +48 for Poland)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
