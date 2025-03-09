
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { sendDealerWelcomeEmail } from "@/services/emailService";
import { mapFormToDatabase } from "@/utils/dealerProfileMapping";

export function useCompleteRegistration(userId: string | undefined) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Additional client-side validation
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

  const handleSubmit = async (values: DealerFormValues) => {
    if (!userId) {
      toast({
        title: "Invalid Access",
        description: "Please complete the registration process from the beginning.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

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

      // Generate a random password that won't be used (passwordless auth)
      const securePassword = crypto.randomUUID() + crypto.randomUUID();

      // Use our mapping function to normalize and transform all data
      const mappedData = mapFormToDatabase(values);

      // Format data for the RPC function
      const formattedData = {
        p_email: mappedData.email,
        p_password: securePassword, // Random password as we're using passwordless login
        p_supervisor_name: mappedData.supervisor_name,
        p_company_name: mappedData.dealership_name,
        p_tax_id: mappedData.tax_id,
        p_business_registry_number: mappedData.business_registry_number,
        p_address: mappedData.address,
        p_phone_number: mappedData.phone_number
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
        } else {
          throw error;
        }
      }

      // Send welcome email
      try {
        await sendDealerWelcomeEmail(
          mappedData.supervisor_name,
          mappedData.email
        );
        console.log("Welcome email sent successfully after profile completion");
      } catch (emailError) {
        console.error("Failed to send welcome email after profile completion:", emailError);
        // Continue with registration even if email fails
      }

      toast({
        title: "Registration Complete",
        description: "Your dealer profile has been created successfully. You'll receive a login code via email when you sign in.",
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

  return {
    isSubmitting,
    formErrors,
    handleSubmit,
    setFormErrors
  };
}
