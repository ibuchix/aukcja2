import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { formatTaxIdForDisplay, formatBusinessRegistryForDisplay } from "@/utils/dealer-profile-utils";

interface CompanyInfoFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function CompanyInfoFields({ form }: CompanyInfoFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nazwa firmy</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Wprowadź nazwę firmy
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="taxId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numer NIP</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                maxLength={13} // Allow for formatted input with dashes
                onChange={(e) => {
                  // Remove non-digits for storage
                  const rawValue = e.target.value.replace(/[^\d]/g, '');
                  
                  // Update the raw value in the form
                  field.onChange(rawValue);
                  
                  // If we need to update the displayed value with formatting
                  if (e.target.value !== field.value && rawValue.length === 10) {
                    // Format will be applied on blur or when maxlength is reached
                    e.target.value = formatTaxIdForDisplay(rawValue);
                  }
                }}
                onBlur={(e) => {
                  // Format on blur if we have valid length
                  field.onBlur();
                  if (field.value.length === 10) {
                    e.target.value = formatTaxIdForDisplay(field.value);
                  }
                }}
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Wprowadź numer NIP
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="businessRegistryNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numer REGON</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                maxLength={16} // Allow for formatting with dashes
                onChange={(e) => {
                  // Remove non-digits for storage
                  const rawValue = e.target.value.replace(/[^\d]/g, '');
                  
                  // Update the raw value in the form
                  field.onChange(rawValue);
                  
                  // If valid length for formatting, update displayed value
                  if (e.target.value !== field.value && (rawValue.length === 9 || rawValue.length === 14)) {
                    e.target.value = formatBusinessRegistryForDisplay(rawValue);
                  }
                }}
                onBlur={(e) => {
                  // Format on blur if valid length
                  field.onBlur();
                  if (field.value.length === 9 || field.value.length === 14) {
                    e.target.value = formatBusinessRegistryForDisplay(field.value);
                  }
                }}
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Wprowadź numer REGON
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="companyAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adres firmy</FormLabel>
            <FormControl>
              <Input 
                {...field} 
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
