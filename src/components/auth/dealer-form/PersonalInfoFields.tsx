
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { PasswordValidation } from "../PasswordValidation";
import { useState } from "react";

interface PersonalInfoFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function PersonalInfoFields({ form }: PersonalInfoFieldsProps) {
  const [passwordValue, setPasswordValue] = useState("");

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
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input 
                type="email" 
                {...field} 
                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
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
              <Input 
                type="password" 
                {...field} 
                onChange={(e) => {
                  field.onChange(e);
                  setPasswordValue(e.target.value);
                }}
                disabled={form.formState.isSubmitting}
              />
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
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
