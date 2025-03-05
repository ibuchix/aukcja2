
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmailFormValues } from "./useEmailForm";
import { UseFormReturn } from "react-hook-form";

interface EmailFormProps {
  form: UseFormReturn<EmailFormValues>;
  onSubmit: (values: EmailFormValues) => Promise<void>;
  isLoading: boolean;
}

export function EmailForm({ form, onSubmit, isLoading }: EmailFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="your@email.com" 
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending code..." : "Send login code"}
        </Button>
      </form>
    </Form>
  );
}
