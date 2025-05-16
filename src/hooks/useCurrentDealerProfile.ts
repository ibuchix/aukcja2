
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isValidRecord } from '@/utils/supabaseHelpers';
import { useAuth } from '@/contexts/AuthContext';

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

// Type guard to check if a JSON response matches our DealerProfile structure
function isDealerProfile(data: any): data is DealerProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    'id' in data &&
    'user_id' in data &&
    'dealership_name' in data &&
    'supervisor_name' in data &&
    typeof data.id === 'string' &&
    typeof data.user_id === 'string'
  );
}

export function useCurrentDealerProfile() {
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshSession } = useAuth();
  
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
        
        // First try using the security definer function (bypasses RLS)
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_dealer_by_user_id', { p_user_id: session.user.id });
          
          if (!rpcError && rpcData) {
            // Use our type guard to ensure the response has the correct structure
            if (isDealerProfile(rpcData)) {
              setDealerProfile(rpcData);
              setIsLoading(false);
              return;
            } else {
              console.warn('RPC data structure does not match DealerProfile type', rpcData);
            }
          } else {
            console.warn('Could not fetch dealer profile using RPC, falling back to direct query', rpcError);
            
            // If RPC failed, try refreshing the session
            await refreshSession();
          }
        } catch (rpcErr) {
          console.error('Error with RPC method:', rpcErr);
          // Continue to fallback
        }
        
        // Fallback to direct query
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
  }, [refreshSession]);
  
  return {
    dealerProfile,
    isLoading,
    error,
    isVerified: dealerProfile?.is_verified || false
  };
}
