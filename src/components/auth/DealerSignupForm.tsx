import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

// Move form schema to a separate file if this component gets too large
const dealerFormSchema = z.object({
  supervisorName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phoneNumber: z.string().min(9, "Valid phone number is required"),
  companyName: z.string().min(2, "Company name is required"),
  taxId: z.string().min(10, "Valid NIP number is required"),
  businessRegistryNumber: z.string().min(9, "Valid REGON number is required"),
  companyAddress: z.string().min(5, "Company address is required"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type DealerFormValues = z.infer<typeof dealerFormSchema>;

export function DealerSignupForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: "",
      password: "",
      phoneNumber: "",
      companyName: "",
      taxId: "",
      businessRegistryNumber: "",
      companyAddress: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    try {
      // Show initial loading state
      const loadingToast = toast({
        title: "Processing registration...",
        description: "Please wait while we set up your account.",
      });

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Step 2: Create dealer record
      const { error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: values.supervisorName,
          dealership_name: values.companyName,
          license_number: 'pending',
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          address: values.companyAddress,
          verification_status: 'pending',
          is_verified: false,
        });

      if (dealerError) {
        console.error("Dealer creation error:", dealerError);
        throw new Error("Failed to create dealer profile");
      }

      // Step 3: Send welcome email
      const { error: emailError } = await supabase.functions.invoke('send-dealer-welcome', {
        body: {
          to: values.email,
          name: values.supervisorName,
          confirmationUrl: `${window.location.origin}/confirm-email`,
        },
      });

      if (emailError) {
        console.error("Email sending error:", emailError);
        // Don't throw here, as the account is already created
        toast({
          title: "Email Notification Issue",
          description: "Your account was created but we couldn't send the welcome email. Please contact support.",
          variant: "destructive",
        });
      } else {
        // Clear loading toast and show success
        toast({
          title: "Registration Successful!",
          description: "Please check your email to confirm your account. You'll be able to log in after confirmation.",
          duration: 6000,
        });
      }

      // Reset form
      form.reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="supervisorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name of Account Supervisor</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
                <Input type="email" {...field} />
              </FormControl>
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
                <Input type="password" {...field} />
              </FormControl>
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
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
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
                <Input {...field} />
              </FormControl>
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
                <Input {...field} />
              </FormControl>
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
                <Input {...field} />
              </FormControl>
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
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to and accept the terms and conditions of the service
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
}