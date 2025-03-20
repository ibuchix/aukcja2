
import { ReactNode, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { useFormValidation } from "@/hooks/useFormValidation";

interface ValidatedFieldProps {
  name: string;
  label: string;
  form: UseFormReturn<any>;
  formType: 'dealer-registration' | 'profile-update' | 'login' | 'vehicle-listing' | 'general';
  description?: string;
  children: ReactNode;
}

/**
 * A wrapper component that adds real-time validation to form fields
 */
export function ValidatedField({
  name,
  label,
  form,
  formType,
  description,
  children
}: ValidatedFieldProps) {
  const { validateFormField } = useFormValidation(formType);
  
  // Watch for changes to validate in real-time
  const value = form.watch(name);
  
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      // Only validate non-empty fields to avoid triggering errors too early
      validateFormField(name, value);
    }
  }, [value, name, validateFormField]);
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {children}
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
