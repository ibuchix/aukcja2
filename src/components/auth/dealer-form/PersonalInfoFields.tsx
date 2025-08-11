
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PersonalInfoFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function PersonalInfoFields({ form }: PersonalInfoFieldsProps) {
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
      form.setValue("phoneNumber", "+48");
    }
  }, [form]);

  return (
    <>
      <FormField
        control={form.control}
        name="supervisorName"
        render={({ field }) => (
            <FormItem>
              <FormLabel>Imię i nazwisko opiekuna konta</FormLabel>
              <FormControl>
                <Input {...field} onBlur={field.onBlur} disabled={form.formState.isSubmitting} />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Podaj swoje pełne imię i nazwisko zgodnie z danymi w dokumentach tożsamości.
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
                    Use a valid business email for verification purposes. You will receive a login code at this email when signing in.
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
              Ten adres e-mail będzie służył do logowania
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numer telefonu</FormLabel>
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
