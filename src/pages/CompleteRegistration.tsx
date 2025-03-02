
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
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: state?.email || "",
      password: "",
      phoneNumber: "+",
      companyName: "",
      taxId: "",
      businessRegistryNumber: "",
      companyAddress: "",
      acceptTerms: false,
    },
    mode: "onBlur", // Validate fields on blur for better UX
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

  // Additional client-side validation before submitting
  const validateFormData = (values: DealerFormValues): string[] => {
    const errors: string[] = [];

    // Validate phone number format
    if (!values.phoneNumber.startsWith('+') || values.phoneNumber.length < 8) {
      errors.push("Phone number must include country code and be at least 8 digits");
    }

    // Validate email format more strictly
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.push("Email address format is invalid");
    }

    // Validate tax ID format (basic check - could be customized per country)
    if (!/^[A-Za-z0-9]{5,}$/.test(values.taxId)) {
      errors.push("Tax ID must be at least 5 alphanumeric characters");
    }

    // Validate company name has at least two words
    if (values.companyName.trim().split(/\s+/).filter(Boolean).length < 2) {
      errors.push("Company name should include at least two words");
    }

    // Validate company address has street number and name
    if (!/\d+/.test(values.companyAddress) || values.companyAddress.length < 10) {
      errors.push("Company address should include street number and be complete");
    }

    return errors;
  };

  const onSubmit = async (values: DealerFormValues) => {
    if (!state?.userId) return;

    // Clear previous errors
    setFormErrors([]);

    // Perform additional client-side validation
    const errors = validateFormData(values);
    if (errors.length > 0) {
      setFormErrors(errors);
      // Also show toast for the first error
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Format and normalize data before submission
      const formattedData = {
        p_email: values.email.trim().toLowerCase(),
        p_password: values.password,
        p_supervisor_name: values.supervisorName.trim(),
        p_company_name: values.companyName.trim(),
        p_tax_id: values.taxId.trim(),
        p_business_registry_number: values.businessRegistryNumber.trim(),
        p_address: values.companyAddress.trim(),
        p_phone_number: values.phoneNumber.replace(/\s+/g, '') // Remove all spaces
      };

      // Call Supabase RPC function
      const { data, error } = await supabase.rpc('create_dealer_with_profile', formattedData);

      if (error) {
        console.error("Profile creation error:", error);
        
        // Handle specific error cases
        if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
          throw new Error("An account with this email already exists. Please use a different email address.");
        } else if (error.message.includes("Invalid email")) {
          throw new Error("The email format is invalid. Please check and try again.");
        } else if (error.message.toLowerCase().includes("password")) {
          throw new Error("Password doesn't meet security requirements. Please choose a stronger password.");
        } else {
          throw error;
        }
      }

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
          {formErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {formErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
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
