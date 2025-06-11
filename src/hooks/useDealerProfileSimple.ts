
import { useState, useEffect } from 'react';
import { rawSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDebugger } from '@/utils/authDebugger';

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

// Type guard function to check if data is a valid dealer profile
function isDealerProfile(data: any): data is DealerProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.user_id === 'string' &&
    typeof data.dealership_name === 'string' &&
    typeof data.supervisor_name === 'string'
  );
}

export function useDealerProfileSimple() {
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession, session, isInitialized } = useAuth();
  
  const fetchProfile = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting dealer profile fetch for user:', user.id);
      
      // Debug auth state before query
      const authDebug = await AuthDebugger.captureAuthState("Profile Fetch Start");
      
      if (!AuthDebugger.isAuthReady(authDebug)) {
        console.warn('Auth context not ready, retrying in 500ms');
        setTimeout(fetchProfile, 500);
        return;
      }
      
      // First try the security definer function approach using generic rpc call
      try {
        console.log('Trying security definer function approach');
        const { data: safeData, error: safeError } = await rawSupabaseClient
          .rpc('get_dealer_profile_safe' as any, { p_user_id: user.id });
        
        if (!safeError && safeData && isDealerProfile(safeData)) {
          console.log('Security definer function succeeded:', safeData);
          setDealerProfile(safeData);
          await AuthDebugger.captureAuthState("Profile Fetch Success (Safe Function)");
          return;
        } else if (safeError) {
          console.warn('Security definer function failed:', safeError);
        }
      } catch (safeErr) {
        console.warn('Security definer function exception:', safeErr);
      }
      
      // Fallback to direct query with enhanced debugging
      console.log('Trying direct RLS query approach');
      
      // Verify session is still valid
      const { data: sessionData, error: sessionError } = await rawSupabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error('Session verification failed:', sessionError);
        await AuthDebugger.captureAuthState("Session Verification Failed");
        setError('Authentication session error. Please try logging out and back in.');
        return;
      }
      
      if (!sessionData.session) {
        console.error('No active session found during profile fetch');
        await AuthDebugger.captureAuthState("No Active Session");
        setError('No active session. Please log in again.');
        return;
      }
      
      console.log('Session verified, executing direct query');
      
      // Direct query to dealers table using raw client
      const { data, error: queryError } = await rawSupabaseClient
        .from('dealers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (queryError) {
        console.error('Direct query failed:', queryError);
        await AuthDebugger.captureAuthState("Direct Query Failed");
        
        // Handle specific error types
        if (queryError.code === '42501' || queryError.message?.includes('permission')) {
          setError('Permission denied. Your authentication may have expired. Please try refreshing.');
        } else {
          setError(`Database error: ${queryError.message}`);
        }
        return;
      }
      
      // Handle successful query result
      if (data && isDealerProfile(data)) {
        console.log('Direct query succeeded:', data);
        setDealerProfile(data);
        await AuthDebugger.captureAuthState("Profile Fetch Success (Direct Query)");
      } else {
        console.log('No dealer profile found for user:', user.id);
        await AuthDebugger.captureAuthState("No Dealer Profile Found");
        setError('No dealer profile found. Please complete your registration.');
      }
      
    } catch (err) {
      console.error('Unexpected error fetching dealer profile:', err);
      await AuthDebugger.captureAuthState("Profile Fetch Exception");
      setError('An unexpected error occurred while loading your profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch profile when auth is ready
  useEffect(() => {
    // Only fetch if auth is initialized and we have a user
    if (isInitialized && user?.id && session) {
      fetchProfile();
    } else if (isInitialized && !user) {
      // Auth is initialized but no user - clear loading state
      setIsLoading(false);
      setError(null);
      setDealerProfile(null);
    }
  }, [user?.id, session, isInitialized]);
  
  // Retry function for manual refresh
  const retryFetch = async () => {
    try {
      console.log('Manual retry requested');
      await AuthDebugger.captureAuthState("Manual Retry Start");
      await refreshSession();
      
      // Give session refresh time to propagate
      setTimeout(() => {
        fetchProfile();
      }, 1000);
    } catch (err) {
      console.error('Error refreshing session:', err);
      await AuthDebugger.captureAuthState("Manual Retry Error");
      // Try direct fetch anyway
      fetchProfile();
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
