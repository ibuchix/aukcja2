
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RegistrationData {
  email: string;
  password: string;
  supervisorName: string;
  companyName: string;
  taxId: string;
  businessRegistryNumber: string;
  address: string;
  phoneNumber?: string;
}

export interface CompletionResults {
  success: boolean;
  userId?: string;
  error?: string;
}

export const useCompleteRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const completeRegistration = async (data: RegistrationData): Promise<CompletionResults> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if email already exists
      const { data: existsData, error: existsError } = await supabase.rpc('check_email_exists', {
        email_to_check: data.email
      });
      
      if (existsError) {
        throw new Error(`Error checking email: ${existsError.message}`);
      }
      
      if (existsData?.exists) {
        return {
          success: false,
          error: 'An account with this email already exists. Please log in instead.'
        };
      }
      
      // Create the dealer account via the RPC function
      const { data: dealerData, error: dealerError } = await supabase.rpc(
        'create_dealer_with_profile',
        {
          p_email: data.email,
          p_password: data.password,
          p_supervisor_name: data.supervisorName,
          p_company_name: data.companyName,
          p_tax_id: data.taxId,
          p_business_registry_number: data.businessRegistryNumber,
          p_address: data.address,
          p_phone_number: data.phoneNumber || ''
        }
      );
      
      if (dealerError) {
        // Handle specific error codes
        if (dealerError.code === '23505') {
          return {
            success: false,
            error: 'An account with this email already exists.'
          };
        }
        
        throw new Error(`Registration error: ${dealerError.message}`);
      }
      
      // Check if the operation was successful
      if (dealerData && dealerData.success) {
        // Show success toast
        toast({
          title: "Registration Complete",
          description: "Your dealer account has been created successfully.",
        });
        
        return {
          success: true,
          userId: dealerData.user?.id
        };
      } else {
        // Handle unsuccessful response
        return {
          success: false,
          error: dealerData?.error || 'Unknown error during registration.'
        };
      }
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error during registration.';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    completeRegistration,
    isLoading,
    error
  };
};
