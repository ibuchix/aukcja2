
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
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

      // Use our mapping function to normalize and transform all data
      const mappedData = mapFormToDatabase(values);

      // Check if dealer profile already exists
      const { data: existingDealer, error: checkError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing dealer:", checkError);
        throw new Error("Failed to verify dealer status");
      }
      
      let result;
      
      if (existingDealer) {
        // Update existing dealer profile
        console.log("Updating existing dealer profile");
        const { data, error } = await supabase
          .from('dealers')
          .update({
            supervisor_name: mappedData.supervisor_name,
            dealership_name: mappedData.dealership_name,
            tax_id: mappedData.tax_id,
            business_registry_number: mappedData.business_registry_number,
            address: mappedData.address,
            license_number: mappedData.business_registry_number, // Use business registry as license for now
            updated_at: new Date().toISOString() // Fix: Convert Date to string
          })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new dealer profile
        console.log("Creating new dealer profile");
        const { data, error } = await supabase
          .from('dealers')
          .insert({
            user_id: userId,
            supervisor_name: mappedData.supervisor_name,
            dealership_name: mappedData.dealership_name,
            tax_id: mappedData.tax_id,
            business_registry_number: mappedData.business_registry_number,
            address: mappedData.address,
            license_number: mappedData.business_registry_number, // Use business registry as license for now
            verification_status: 'pending',
            is_verified: false
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }

      // Also update user metadata with phone number (which is stored in auth.users)
      if (mappedData.phone_number) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { 
            phone_number: mappedData.phone_number
          }
        });
        
        if (metadataError) {
          console.warn("Failed to update phone number in user metadata:", metadataError);
          // Continue despite this error
        }
      }

      toast({
        title: "Registration Complete",
        description: "Your dealer profile has been created successfully.",
      });

      navigate('/dealer/dashboard');
    } catch (error) {
      console.error("Profile completion error:", error);
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes("duplicate key") || error.message.includes("unique violation")) {
          setFormErrors(["A dealer with this information already exists. Please check your tax ID and business registry number."]);
        } else {
          setFormErrors([error.message]);
        }
      } else {
        setFormErrors(["An unexpected error occurred"]);
      }
      
      toast({
        title: "Registration Failed",
        description: "Failed to complete registration. Please check the errors and try again.",
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
