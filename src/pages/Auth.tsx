import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDealer, setIsDealer] = useState(false);

  const form = useForm<z.infer<typeof dealerFormSchema>>({
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/dealer/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (values: z.infer<typeof dealerFormSchema>) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
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

        if (dealerError) throw dealerError;

        // Send welcome email
        const { error: emailError } = await supabase.functions.invoke('send-dealer-welcome', {
          body: {
            to: values.email,
            name: values.supervisorName,
            confirmationUrl: `${window.location.origin}/confirm-email`,
          },
        });

        if (emailError) throw emailError;

        toast({
          title: "Registration Successful",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 font-heading">Dealer Portal</h1>
        
        <div className="mb-6">
          <Button
            onClick={() => setIsDealer(false)}
            variant={!isDealer ? "default" : "outline"}
            className="mr-2"
          >
            Login
          </Button>
          <Button
            onClick={() => setIsDealer(true)}
            variant={isDealer ? "default" : "outline"}
          >
            Dealer Sign Up
          </Button>
        </div>

        {!isDealer ? (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
          />
        ) : (
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

              <Button type="submit" className="w-full">
                Sign Up
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;