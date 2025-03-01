import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormFields } from "@/components/auth/DealerFormFields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: state?.email || "",
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
    // Check if we have a valid state with userId
    if (!state?.userId) {
      toast({
        title: "Invalid Access",
        description: "Please complete the registration process from the beginning.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [state, navigate, toast]);

  const onSubmit = async (values: DealerFormValues) => {
    if (!state?.userId) return;

    try {
      setIsSubmitting(true);

      // The function expects all these parameters including email and password
      const { data, error } = await supabase.rpc('create_dealer_with_profile', {
        p_email: values.email,
        p_password: values.password,
        p_supervisor_name: values.supervisorName,
        p_company_name: values.companyName,
        p_tax_id: values.taxId,
        p_business_registry_number: values.businessRegistryNumber,
        p_address: values.companyAddress
      });

      if (error) throw error;

      toast({
        title: "Registration Complete",
        description: "Your dealer profile has been created successfully.",
      });

      navigate('/dealer/dashboard');
    } catch (error) {
      console.error("Profile completion error:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to complete registration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-oswald text-[#DC143C]">Complete Your Registration</CardTitle>
          <CardDescription className="font-kanit">
            Please provide your dealer information to complete the registration process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <DealerFormFields form={form} />
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
