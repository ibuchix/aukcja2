
import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from "./useAuthState";
import { AuthContext } from "./context";
import { defaultContextValue } from "./types";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useAuthActions } from "./useAuthActions";
import { useSignInHandler } from "./useSignInHandler";
import { sessionCircuitBreaker, isRetryableError } from "@/utils/sessionCircuitBreaker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

// Define a type for the refresh result to properly handle both success and error cases
type RefreshResult = 
  | { success: true; session: any; user: any }
  | { success: false; error: string };

// Provider that can be used with Router hooks
export function AuthProviderWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get all auth state and handlers
  const { 
    session, 
    user, 
    profile, 
    isLoading, 
    isInitialized, // Include initialization state
    setProfile,
    setSession,
    setUser,
    setIsLoading 
  } = useAuthState();
  
  const { signOut } = useAuthActions();
  const { signIn } = useSignInHandler();
  
  // Get session manager
  const { registerRefreshFunction } = useSessionManager();

  // Track refresh state with ref to avoid triggering effects
  const refreshStateRef = useRef({
    isRefreshing: false,
    lastRefreshTime: 0
  });

  // Create memoized refresh function to avoid dependency issues
  const memoizedRefreshSession = useCallback(async (): Promise<RefreshResult> => {
    console.log("Session refresh requested");
    
    try {
      // Use circuit breaker to protect against cascading failures
      const refreshResult = await sessionCircuitBreaker.executeRefresh(async () => {
        console.log("Executing session refresh");
        
        // Mark refresh in progress (for our local ref tracking)
        refreshStateRef.current.isRefreshing = true;
        refreshStateRef.current.lastRefreshTime = Date.now();
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh error:', error.message);
          
          // Show a toast for auth errors only when they might affect the user
          if (session && !isRetryableError(error)) {
            toast({
              title: "Authentication Issue",
              description: "Your session couldn't be refreshed. You may need to sign in again.",
              variant: "destructive",
            });
          }
          
          throw error;
        }
        
        if (data.session) {
          console.log("Session refreshed successfully");
          setSession(data.session);
          setUser(data.user);
          return { success: true, session: data.session, user: data.user };
        } else {
          console.warn("No session returned from refresh");
          throw new Error("No session returned");
        }
      });
      
      return refreshResult as RefreshResult;
    } catch (error) {
      console.error('Session refresh failed:', error);
      
      // Check if we've hit maximum retries - send user to auth
      const circuitStatus = sessionCircuitBreaker.getStatus();
      
      if (circuitStatus.state === 'open' && session) {
        // Only redirect to auth if we were previously authenticated
        console.warn('Circuit breaker tripped, redirecting to auth');
        toast({
          title: "Session Expired",
          description: "You've been signed out due to authentication issues. Please sign in again.",
          variant: "destructive",
        });
        
        // Perform clean sign out
        await signOut();
        
        // Redirect to login
        navigate('/auth?tab=login');
      }
      
      return { 
        success: false, 
        error: typeof error === 'object' && error !== null 
          ? (error as Error).message 
          : 'Failed to refresh session'
      };
    } finally {
      refreshStateRef.current.isRefreshing = false;
    }
  }, [setSession, setUser, session, toast, signOut, navigate]);
  
  // Use a ref to track initialization to prevent multiple initializations
  const initRef = useRef(false);

  // Register the refresh function with the session manager, only once
  useEffect(() => {
    if (initRef.current) return;
    
    console.log("Registering refresh function with session manager");
    registerRefreshFunction(memoizedRefreshSession);
    initRef.current = true;
    
    // Don't include dependencies that would cause this to run multiple times
  }, [registerRefreshFunction, memoizedRefreshSession]);

  // Create the auth context value
  const contextValue = {
    session,
    user,
    profile,
    isLoading,
    isInitialized, // Expose initialization state to consumers
    isAuthenticated: !!user,
    signOut: async () => {
      const result = await signOut();
      // Reset the circuit breaker on sign out
      sessionCircuitBreaker.reset();
      return result.success ? Promise.resolve() : Promise.reject(result.error);
    },
    refreshSession: async () => {
      // Check if we're actively refreshing to prevent duplicate calls
      if (refreshStateRef.current.isRefreshing) {
        console.log("Refresh already in progress, skipping duplicate request");
        return Promise.resolve();
      }
      
      // Check minimum interval between refresh attempts (1 second)
      const timeSinceLastRefresh = Date.now() - refreshStateRef.current.lastRefreshTime;
      if (timeSinceLastRefresh < 1000) {
        console.log(`Too many refresh requests (${timeSinceLastRefresh}ms since last). Throttling.`);
        return Promise.resolve();
      }
      
      const result = await memoizedRefreshSession();
      return result.success ? Promise.resolve() : Promise.reject(result.error);
    },
    signIn: async ({ email, password, redirectTo }) => {
      // Reset the circuit breaker on sign in attempt
      sessionCircuitBreaker.reset();
      const result = await signIn({ email, password, redirectTo });
      // Map the response to the expected structure in the context
      return result;
    },
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Basic AuthProvider that doesn't depend on Router
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={defaultContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Re-export useAuth from context
export { useAuth } from './context';
