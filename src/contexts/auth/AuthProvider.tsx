
import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from "./useAuthState";
import { AuthContext } from "./context";
import { defaultContextValue } from "./types";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useAuthActions } from "./useAuthActions";
import { useSignInHandler } from "./useSignInHandler";

// Provider that can be used with Router hooks
export function AuthProviderWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  
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

  // Create memoized refresh function to avoid dependency issues
  const memoizedRefreshSession = useCallback(() => {
    console.log("Memoized refresh session called");
    // We'll implement this refresh function directly here instead of using refreshSession from useAuthActions
    const refreshSession = async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        
        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          return { success: true, session: data.session, user: data.user };
        } else {
          throw new Error("No session returned");
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        return { 
          success: false, 
          error: typeof error === 'object' && error !== null 
            ? (error as Error).message 
            : 'Failed to refresh session'
        };
      }
    };
    
    return refreshSession();
  }, [setSession, setUser]);
  
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
      return result.success ? Promise.resolve() : Promise.reject(result.error);
    },
    refreshSession: async () => {
      const result = await memoizedRefreshSession();
      return result.success ? Promise.resolve() : Promise.reject(result.error);
    },
    signIn: async ({ email, password, redirectTo }) => {
      const result = await signIn({ email, password, redirectTo });
      // Map the response to the expected structure in the context
      return { 
        success: !result.error, 
        error: result.error ? String(result.error) : undefined 
      };
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

import { supabase } from '@/integrations/supabase/client';
