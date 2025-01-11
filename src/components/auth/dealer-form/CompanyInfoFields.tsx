import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

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
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Enter your registered company name
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
            <FormLabel>Tax Identification Number (NIP)</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  field.onChange(value);
                }}
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Must be exactly 10 digits
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
            <FormLabel>National Business Registry Number (REGON)</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                maxLength={14}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  field.onChange(value);
                }}
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Must be either 9 or 14 digits
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
            <FormLabel>Company Address</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Enter your registered company address
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}