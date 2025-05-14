
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RegistrationData, CompleteRegistrationOptions, OperationResult } from '@/types/profile'; 

interface UseCompleteRegistrationReturn {
  submitRegistration: (
    data: RegistrationData, 
    options?: CompleteRegistrationOptions
  ) => Promise<OperationResult<{ success: boolean }>>;
  isSubmitting: boolean;
  error: string;
}

export const useCompleteRegistration = (): UseCompleteRegistrationReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const submitRegistration = async (
    formData: RegistrationData,
    options?: CompleteRegistrationOptions
  ): Promise<OperationResult<{ success: boolean }>> => {
    setIsSubmitting(true);
    setError('');

    try {
      // Validate user exists
      if (!formData.userId) {
        throw new Error('User ID is required to complete registration');
      }

      // Create dealer profile
      const dealerProfile = {
        user_id: formData.userId,
        dealership_name: formData.dealershipName,
        address: formData.address,
        supervisor_name: formData.supervisorName,
        license_number: formData.licenseNumber || '',
        tax_id: formData.taxId,
        business_registry_number: formData.businessRegistryNumber,
        verification_status: 'pending',
        is_verified: false,
      };

      // Create or update user_profiles record
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: formData.userId,
          role: 'dealer',
          profile_status: 'active',
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // Create or update dealer profile
      const dealerData = await supabase
        .from('dealer_profiles')
        .upsert(dealerProfile)
        .select('id');

      if (dealerData.error) {
        throw new Error(`Failed to create dealer profile: ${dealerData.error.message}`);
      }

      // Set the user's custom claim to indicate registration is complete
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          registration_completed: true,
          dealer_profile_id: dealerData?.data?.[0]?.id
        }
      });

      if (metadataError) {
        throw new Error(`Failed to update user metadata: ${metadataError.message}`);
      }

      // Notify about new dealer registration
      if (options?.notifyAdmin) {
        await supabase.functions.invoke('send-email', {
          body: {
            template: 'new_dealer_registration',
            dealerProfile: {
              id: dealerData?.data?.[0]?.id,
              dealership_name: formData.dealershipName,
              address: formData.address,
              supervisor_name: formData.supervisorName,
              tax_id: formData.taxId,
              business_registry_number: formData.businessRegistryNumber
            }
          }
        });
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRegistration,
    isSubmitting,
    error
  };
};
