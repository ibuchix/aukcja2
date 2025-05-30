
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useDealerProfileSimple() {
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession } = useAuth();
  
  const fetchProfile = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching dealer profile for user:', user.id);
      
      // Direct query to dealers table with proper error handling
      const { data, error: queryError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (queryError) {
        console.error('Error fetching dealer profile:', queryError);
        
        // Handle specific error types
        if (queryError.code === '42501' || queryError.message?.includes('permission')) {
          setError('Permission denied. Please ensure you have a valid dealer account.');
        } else {
          setError(`Database error: ${queryError.message}`);
        }
        return;
      }
      
      if (data) {
        console.log('Dealer profile loaded successfully:', data);
        setDealerProfile(data as DealerProfile);
      } else {
        console.log('No dealer profile found for user:', user.id);
        setError('No dealer profile found. Please complete your registration.');
      }
      
    } catch (err) {
      console.error('Unexpected error fetching dealer profile:', err);
      setError('An unexpected error occurred while loading your profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [user?.id]);
  
  // Retry function for manual refresh
  const retryFetch = async () => {
    try {
      await refreshSession();
      setTimeout(fetchProfile, 1000); // Give session refresh time to propagate
    } catch (err) {
      console.error('Error refreshing session:', err);
      fetchProfile(); // Try direct fetch anyway
    }
  };
  
  return {
    dealerProfile,
    isLoading,
    error,
    retryFetch,
    isVerified: dealerProfile?.is_verified || false,
    profileExists: !!dealerProfile
  };
}
