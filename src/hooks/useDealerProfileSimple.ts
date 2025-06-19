
import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Add refs to prevent infinite loops
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isLoadingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const minFetchInterval = 2000; // 2 seconds minimum between fetches
  
  const fetchProfile = useCallback(async () => {
    const now = Date.now();
    
    // Prevent concurrent fetches and rate limiting
    if (isLoadingRef.current || (now - lastFetchTimeRef.current < minFetchInterval)) {
      return;
    }
    
    if (!user?.id) {
      setIsLoading(false);
      setError(null);
      setDealerProfile(null);
      return;
    }
    
    // Check retry limit
    if (retryCountRef.current >= maxRetries) {
      setIsLoading(false);
      setError('Maximum retry attempts reached. Please refresh the page.');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      lastFetchTimeRef.current = now;
      setIsLoading(true);
      setError(null);
      
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev && retryCountRef.current === 0) {
        console.log('Starting dealer profile fetch for user:', user.id);
      }
      
      // Debug auth state only on first attempt
      if (retryCountRef.current === 0) {
        const authDebug = await AuthDebugger.captureAuthState("Profile Fetch Start");
        
        if (!AuthDebugger.isAuthReady(authDebug)) {
          retryCountRef.current++;
          
          // Schedule retry only if under limit
          if (retryCountRef.current < maxRetries) {
            setTimeout(() => {
              isLoadingRef.current = false;
              fetchProfile();
            }, 1000 * retryCountRef.current); // Exponential backoff
            return;
          } else {
            setError('Authentication not ready after multiple attempts');
            return;
          }
        }
      }
      
      // Verify session is still valid
      const { data: sessionData, error: sessionError } = await rawSupabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error('Session verification failed:', sessionError);
        setError('Authentication session error. Please try logging out and back in.');
        return;
      }
      
      if (!sessionData.session) {
        console.error('No active session found during profile fetch');
        setError('No active session. Please log in again.');
        return;
      }
      
      // Direct query to dealers table using raw client
      const { data, error: queryError } = await rawSupabaseClient
        .from('dealers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (queryError) {
        console.error('Direct query failed:', queryError);
        
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
        if (isDev) {
          console.log('Profile fetch successful:', data.dealership_name);
        }
        setDealerProfile(data);
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        if (isDev) {
          console.log('No dealer profile found for user:', user.id);
        }
        setError('No dealer profile found. Please complete your registration.');
      }
      
    } catch (err) {
      console.error('Unexpected error fetching dealer profile:', err);
      setError('An unexpected error occurred while loading your profile.');
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.id, session]);
  
  // Fetch profile when auth is ready - with proper dependencies
  useEffect(() => {
    // Reset retry count when user changes
    retryCountRef.current = 0;
    
    // Only fetch if auth is initialized and we have a user
    if (isInitialized && user?.id && session) {
      fetchProfile();
    } else if (isInitialized && !user) {
      // Auth is initialized but no user - clear loading state
      setIsLoading(false);
      setError(null);
      setDealerProfile(null);
      retryCountRef.current = 0;
    }
  }, [user?.id, session, isInitialized, fetchProfile]);
  
  // Retry function for manual refresh
  const retryFetch = useCallback(async () => {
    try {
      console.log('Manual retry requested');
      retryCountRef.current = 0; // Reset retry count for manual refresh
      await refreshSession();
      
      // Give session refresh time to propagate
      setTimeout(() => {
        fetchProfile();
      }, 1000);
    } catch (err) {
      console.error('Error refreshing session:', err);
      // Try direct fetch anyway
      fetchProfile();
    }
  }, [refreshSession, fetchProfile]);
  
  return {
    dealerProfile,
    isLoading,
    error,
    retryFetch,
    isVerified: dealerProfile?.is_verified || false,
    profileExists: !!dealerProfile
  };
}
