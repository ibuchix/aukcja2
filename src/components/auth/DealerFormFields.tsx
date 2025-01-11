import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { Info } from "lucide-react";

interface DealerFormFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function DealerFormFields({ form }: DealerFormFieldsProps) {
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
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Must contain at least 8 characters, including uppercase, lowercase, and numbers
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
    </>
  );
}