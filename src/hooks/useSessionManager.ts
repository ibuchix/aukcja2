
import { useEffect, useRef } from 'react';
import { refreshAuthToken, shouldRefreshSession } from '@/utils/sessionRefresh';
import { supabase } from '@/integrations/supabase/client';

type RefreshFunction = () => Promise<any>;

/**
 * Custom hook to manage session refresh
 */
export function useSessionManager() {
  const refreshFunctionRef = useRef<RefreshFunction | null>(null);
  const intervalRef = useRef<number | null>(null);
  const initialized = useRef(false);
  const hadSession = useRef(false);

  // Set up periodic session checking
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log("Setting up session manager");

    // Function to check and refresh session if needed
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (!session) {
          console.log("No active session to refresh");
          hadSession.current = false;
          return;
        }

        hadSession.current = true;
        
        // Check if session needs refresh (within 5 minutes of expiry)
        if (shouldRefreshSession(session, 5)) {
          console.log("Session needs refresh, refreshing...");
          
          if (refreshFunctionRef.current) {
            await refreshFunctionRef.current();
          } else {
            console.warn("No refresh function registered");
            // Fallback to direct refresh
            await refreshAuthToken();
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    // Initial check
    checkSession();

    // Set up interval for periodic checking (every 2 minutes)
    const intervalId = window.setInterval(checkSession, 2 * 60 * 1000);
    intervalRef.current = intervalId as unknown as number;

    // Clean up
    return () => {
      console.log("Cleaning up session manager");
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Register a function to refresh the session
  const registerRefreshFunction = (refreshFn: RefreshFunction) => {
    console.log("Session manager: Registering refresh function");
    refreshFunctionRef.current = refreshFn;
  };

  return {
    registerRefreshFunction,
    hadSession: () => hadSession.current
  };
}
