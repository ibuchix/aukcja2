
import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from "./useAuthState";
import { useAuthActions } from "./useAuthActions";
import { useSignInHandler } from "./useSignInHandler";
import { useSessionManager } from "@/hooks/useSessionManager";
import { AuthContext } from "./context";
import { defaultContextValue } from "./types";

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
    setProfile,
    setSession,
    setUser,
    setIsLoading 
  } = useAuthState();
  
  const { signOut, refreshSession } = useAuthActions(
    setIsLoading,
    setUser,
    setSession,
    setProfile
  );
  
  const { signIn } = useSignInHandler(
    setIsLoading,
    setSession,
    setUser,
    setProfile
  );
  
  // Get session manager
  const { registerRefreshFunction } = useSessionManager();

  // Create memoized refresh function to avoid dependency issues
  const memoizedRefreshSession = useCallback(() => {
    console.log("Memoized refresh session called");
    return refreshSession();
  }, [refreshSession]);

  // Register the refresh function with the session manager
  useEffect(() => {
    console.log("Registering refresh function with session manager");
    registerRefreshFunction(memoizedRefreshSession);
    
    // No need to include memoizedRefreshSession in dependencies
    // since it's already memoized with useCallback
  }, [registerRefreshFunction]);

  // Create the auth context value
  const value = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshSession,
    signIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
