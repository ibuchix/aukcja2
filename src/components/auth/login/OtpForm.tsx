
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OtpFormValues } from "./useOtpForm";
import { UseFormReturn } from "react-hook-form";
import { useEffect } from "react";

interface OtpFormProps {
  form: UseFormReturn<OtpFormValues>;
  onSubmit: (values: OtpFormValues) => Promise<void>;
  isLoading: boolean;
  onBackToEmail: () => void;
  onResendOtp: () => Promise<void>;
}

export function OtpForm({ 
  form, 
  onSubmit, 
  isLoading,
  onBackToEmail,
  onResendOtp
}: OtpFormProps) {
  // Clear form on mount to prevent stale values
  useEffect(() => {
    form.reset({ otp: "" });
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-Time Code</FormLabel>
              <FormControl>
                <InputOTP 
                  maxLength={6}
                  disabled={isLoading}
                  value={field.value || ""}
                  onChange={(value) => {
                    // Only allow digits
                    const numericValue = value.replace(/\D/g, '');
                    field.onChange(numericValue);
                  }}
                  pattern="[0-9]"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify & Login"}
        </Button>
        
        <div className="flex justify-between pt-2 text-sm">
          <button 
            type="button" 
            onClick={onBackToEmail} 
            className="text-primary underline"
            disabled={isLoading}
          >
            Use different email
          </button>
          <button 
            type="button" 
            onClick={onResendOtp} 
            className="text-primary underline"
            disabled={isLoading}
          >
            Resend code
          </button>
        </div>
      </form>
    </Form>
  );
}
