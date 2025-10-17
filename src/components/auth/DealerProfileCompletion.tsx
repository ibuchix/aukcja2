
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { DealerFormFields } from "@/components/auth/DealerFormFields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dealerFormSchema, type DealerFormValues } from "@/schemas/dealerFormSchema";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export function DealerProfileCompletion({ userId, email }: { userId: string, email: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      supervisorName: "",
      email: email || "",
      phoneNumber: "+",
      companyName: "",
      taxId: "",
      businessRegistryNumber: "",
      companyAddress: "",
      acceptTerms: false,
    },
    mode: "onBlur", // Validate fields on blur for better UX
  });

  const onSubmit = async (values: DealerFormValues) => {
    if (!userId) {
      // Toast: Authentication Error - User ID missing
      toast({
        description: "Nie znaleziono ID użytkownika. Spróbuj zalogować się ponownie.",
        variant: "destructive",
      });
      return;
    }

    // Clear previous errors
    setFormErrors([]);
    setIsSubmitting(true);

    try {
      // Generate a random password that won't be used (passwordless auth)
      const securePassword = crypto.randomUUID() + crypto.randomUUID();

      // Format and normalize data before submission
      const formattedData = {
        p_email: values.email.trim().toLowerCase(),
        p_password: securePassword, // Random password as we're using passwordless login
        p_supervisor_name: values.supervisorName.trim(),
        p_company_name: values.companyName.trim(),
        p_tax_id: values.taxId.trim(),
        p_business_registry_number: values.businessRegistryNumber.trim(),
        p_address: values.companyAddress.trim(),
        p_phone_number: values.phoneNumber.replace(/\s+/g, '') // Remove all spaces
      };

      // Call Supabase RPC function to create the profile
      const { data, error } = await supabase.rpc('create_dealer_with_profile', formattedData);

      if (error) {
        console.error("Profile creation error:", error);
        
        // Handle specific error cases
        if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
          throw new Error("An account with this email already exists. Please use a different email address.");
        } else if (error.message.includes("Invalid email")) {
          throw new Error("The email format is invalid. Please check and try again.");
        } else {
          throw error;
        }
      }

      // Toast: Profile Completed - Dealer profile created successfully
      toast({
        description: "Twój profil dealera został pomyślnie utworzony. Możesz teraz uzyskać dostęp do panelu dealera.",
      });

      navigate('/dealer/dashboard');
    } catch (error) {
      console.error("Profile completion error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to complete profile";
      
      setFormErrors([errorMessage]);
      // Toast: Profile Creation Failed - Error creating profile
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-oswald text-[#DC143C]">Complete Your Profile</CardTitle>
        <CardDescription className="font-kanit">
          We need some additional information to complete your dealer profile.
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
                  Completing Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
