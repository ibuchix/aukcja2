
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OperationResult } from '@/utils/supabase/errorTypes';
import { wrapSupabaseOperation } from '@/utils/supabase/errorHandler';
import { useToast } from '@/components/ui/use-toast';

interface RegistrationData {
  dealershipName: string;
  dealershipAddress: string;
  supervisorName: string;
  taxId: string;
  businessRegistryNumber: string;
  email: string;
  [key: string]: string | number | boolean;
}

interface CompleteRegistrationOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submitRegistration = async (
    data: RegistrationData,
    options: CompleteRegistrationOptions = {}
  ): Promise<OperationResult<{ success: boolean }>> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        setError("User not authenticated");
        setIsSubmitting(false);
        
        toast({
          title: "Error",
          description: "You must be logged in to complete registration",
          variant: "destructive"
        });
        
        return {
          error: {
            code: "not_authenticated",
            message: "User not authenticated",
            type: "auth_general"
          },
          success: false
        };
      }

      // First check if dealer profile already exists
      const { data: existingProfile } = await supabase
        .from("dealers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingProfile) {
        // Update existing profile
        const result = await wrapSupabaseOperation(() => 
          supabase
            .from("dealers")
            .update({
              dealership_name: data.dealershipName,
              address: data.dealershipAddress,
              supervisor_name: data.supervisorName,
              tax_id: data.taxId,
              business_registry_number: data.businessRegistryNumber,
              license_number: data.businessRegistryNumber, // Provide fallback for license_number
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId)
        );

        if (!result.success) {
          throw result.error;
        }
      } else {
        // Create new dealer profile
        const result = await wrapSupabaseOperation(() => 
          supabase
            .from("dealers")
            .insert({
              user_id: userId,
              dealership_name: data.dealershipName,
              address: data.dealershipAddress,
              supervisor_name: data.supervisorName,
              tax_id: data.taxId,
              business_registry_number: data.businessRegistryNumber,
              license_number: data.businessRegistryNumber, // Provide required license_number
              verification_status: 'pending',
              is_verified: false
            })
        );

        if (!result.success) {
          throw result.error;
        }
      }

      // Ensure user has the correct role in profiles table
      await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            role: "dealer",
            full_name: data.supervisorName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      // Show success toast
      toast({
        title: "Registration completed",
        description: "Your registration has been submitted for verification."
      });

      if (options.onSuccess) {
        options.onSuccess();
      }

      return { success: true, data: { success: true } };
    } catch (error: any) {
      console.error("Registration error:", error);
      
      const errorMessage = error.message || "Failed to complete registration";
      setError(errorMessage);
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      if (options.onError) {
        options.onError(error);
      }
      
      return {
        error: {
          code: "registration_failed",
          message: errorMessage,
          type: "auth_general"
        },
        success: false
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRegistration,
    isSubmitting,
    error
  };
}
