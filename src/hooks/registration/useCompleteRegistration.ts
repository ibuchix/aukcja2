
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { DealerFormValues } from "@/schemas/dealerFormSchema";

export const useCompleteRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const completeRegistration = async (userId: string, values: DealerFormValues) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "User ID not found. Please try logging in again.",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      console.log("Creating dealer profile with user ID:", userId);
      
      // Call the secure function to create a dealer profile
      const { data, error } = await supabase.rpc('create_dealer_with_profile', {
        p_email: values.email.trim().toLowerCase(),
        p_password: crypto.randomUUID() + crypto.randomUUID(), // Random password as we're using an existing account
        p_supervisor_name: values.supervisorName.trim(),
        p_company_name: values.companyName.trim(),
        p_tax_id: values.taxId.trim(),
        p_business_registry_number: values.businessRegistryNumber.trim(),
        p_address: values.companyAddress.trim(),
        p_phone_number: values.phoneNumber.replace(/\s+/g, '') // Remove all spaces
      });

      if (error) {
        console.error("Profile creation error:", error);
        toast({
          title: "Profile Creation Failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false };
      }

      // Update the user's role in their metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: 'dealer' }
      });

      if (metadataError) {
        console.warn("Failed to update user role metadata:", metadataError);
      }

      toast({
        title: "Profile Completed",
        description: "Your dealer profile has been created successfully. You can now access the dealer dashboard.",
      });
      
      setSuccess(true);
      return { success: true };
    } catch (error) {
      console.error("Profile completion error:", error);
      
      toast({
        title: "Profile Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    completeRegistration,
    isSubmitting,
    success
  };
};
