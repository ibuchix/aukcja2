
import { useEffect, useRef } from 'react';
import { refreshAuthToken, shouldRefreshSession } from '@/utils/sessionRefresh';
import { supabase } from '@/integrations/supabase/client';
import { sessionCircuitBreaker } from '@/utils/sessionCircuitBreaker';

type RefreshFunction = () => Promise<any>;

// Global coordination mechanism to prevent multiple concurrent refreshes
const globalRefreshState = {
  isRefreshing: false,
  lastRefreshTime: 0,
  currentPromise: null as Promise<any> | null,
};

/**
 * Custom hook to manage session refresh operations with circuit breaker protection
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
        // If there's already a refresh happening globally, don't start another
        if (globalRefreshState.isRefreshing) {
          console.log("Global refresh already in progress, skipping check");
          return;
        }
        
        // Enforce minimum time between refreshes
        const now = Date.now();
        if (now - globalRefreshState.lastRefreshTime < 30000) { // 30 seconds
          console.log("Too soon since last refresh, skipping check");
          return;
        }

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
          console.log("Session needs refresh, checking circuit breaker...");
          
          // Check if circuit breaker allows refresh
          const refreshStatus = sessionCircuitBreaker.getStatus();
          if (!refreshStatus.canRefresh) {
            console.log(`Circuit breaker preventing refresh (state: ${refreshStatus.state})`);
            return;
          }
          
          console.log("Circuit breaker allows refresh, proceeding...");
          
          // Set global refresh state
          globalRefreshState.isRefreshing = true;
          globalRefreshState.lastRefreshTime = now;
          
          try {
            if (refreshFunctionRef.current) {
              globalRefreshState.currentPromise = refreshFunctionRef.current();
              await globalRefreshState.currentPromise;
            } else {
              console.warn("No refresh function registered");
              // Fallback to direct refresh
              await refreshAuthToken();
            }
          } finally {
            // Reset global refresh state
            globalRefreshState.isRefreshing = false;
            globalRefreshState.currentPromise = null;
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        globalRefreshState.isRefreshing = false;
        globalRefreshState.currentPromise = null;
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
    hadSession: () => hadSession.current,
    isRefreshing: () => globalRefreshState.isRefreshing,
    getLastRefreshTime: () => globalRefreshState.lastRefreshTime
  };
}
