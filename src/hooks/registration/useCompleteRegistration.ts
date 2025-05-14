
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DealerProfileFormValues } from "@/schemas/profileFormSchema";
import { isValidRecord } from "@/utils/supabaseHelpers";

export const useCompleteRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const completeRegistration = async (formData: DealerProfileFormValues) => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        throw new Error("No authenticated user found. Please log in first.");
      }

      // Create or update the dealer profile
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .upsert({
          user_id: session.user.id,
          dealership_name: formData.dealershipName,
          supervisor_name: formData.supervisorName,
          tax_id: formData.taxId,
          business_registry_number: formData.businessRegistryNumber,
          address: formData.address,
          license_number: formData.licenseNumber,
          verification_status: "pending",
          is_verified: false,
          updated_at: new Date().toISOString()
        })
        .select();

      if (dealerError) {
        throw dealerError;
      }

      // Create verification request - Fixed the id access using isValidRecord check
      if (dealerData && dealerData.length > 0) {
        // Make sure dealerData[0] is a valid record with better type safety
        const dealer = dealerData[0];
        if (dealer && isValidRecord(dealer) && 'id' in dealer) {
          const dealerId: string = dealer.id as string;

          // Create dealer verification record with explicitly typed dealerId
          const { error: verificationError } = await supabase
            .from('dealer_verifications')
            .insert({
              dealer_id: dealerId, // Now explicitly typed as string
              verification_status: 'pending'
            });

          if (verificationError) {
            console.error("Error creating verification record:", verificationError);
          }
        }
      }

      // Show success message
      toast({
        title: "Registration completed",
        description: "Your dealer profile has been submitted for verification.",
      });

      // Redirect to the dashboard
      navigate('/dealer/dashboard');
      
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Format error message
      const errorMessage: string = error.message || "Failed to complete registration";
      setErrors([errorMessage]);
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    completeRegistration,
    isSubmitting,
    errors
  };
};
