
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isValidRecord } from '@/utils/supabaseHelpers';

interface DealerProfile {
  id: string;
  user_id: string;
  dealership_name: string;
  supervisor_name: string;
  tax_id: string; 
  business_registry_number: string;
  address: string;
  verification_status: string;
  is_verified: boolean;
  license_number: string;
  created_at: string;
  updated_at: string;
}

export function useCurrentDealerProfile() {
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDealerProfile() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('No authenticated user when fetching dealer profile');
          setIsLoading(false);
          return;
        }
        
        // Fetch dealer profile
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching dealer profile:', error);
          setError(error.message);
          return;
        }
        
        if (data && isValidRecord<DealerProfile>(data)) {
          setDealerProfile(data as DealerProfile);
        }
      } catch (err) {
        console.error('Unexpected error fetching dealer profile:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDealerProfile();
  }, []);
  
  return {
    dealerProfile,
    isLoading,
    error,
    isVerified: dealerProfile?.is_verified || false
  };
}
