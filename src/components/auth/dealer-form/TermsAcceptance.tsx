import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface TermsAcceptanceProps {
  form: UseFormReturn<DealerFormValues>;
}

export function TermsAcceptance({ form }: TermsAcceptanceProps) {
  return (
    <FormField
      control={form.control}
      name="acceptTerms"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={form.formState.isSubmitting}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm">
              I agree to and accept the terms and conditions of the service
            </FormLabel>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}