
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmailFormValues } from "./useEmailForm";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";

interface EmailFormProps {
  form: UseFormReturn<EmailFormValues>;
  onSubmit: (values: EmailFormValues) => Promise<void>;
  isLoading: boolean;
}

export function EmailForm({ form, onSubmit, isLoading }: EmailFormProps) {
  const [inputValue, setInputValue] = useState("");
  
  // Sanitize and validate email input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit input length for additional security
    const value = e.target.value.slice(0, 100);
    
    // Only allow characters valid in email addresses
    const sanitized = value.replace(/[^a-zA-Z0-9@._+-]/g, '');
    
    setInputValue(sanitized);
    form.setValue('email', sanitized, { shouldValidate: true });
  };

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
                  value={inputValue}
                  onChange={handleEmailChange}
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                  required
                  inputMode="email"
                  onPaste={(e) => {
                    // Allow paste but sanitize it immediately
                    const pasteData = e.clipboardData.getData('text');
                    const sanitized = pasteData.replace(/[^a-zA-Z0-9@._+-]/g, '');
                    e.preventDefault();
                    form.setValue('email', sanitized, { shouldValidate: true });
                    setInputValue(sanitized);
                  }}
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
