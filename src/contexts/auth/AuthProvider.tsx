
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
    setProfile,
    setSession,
    setUser,
    setIsLoading 
  } = useAuthState();
  
  const { signOut, refreshSession } = useAuthActions();
  const { signIn } = useSignInHandler(setIsLoading, setSession, setUser, setProfile);
  
  // Get session manager
  const { registerRefreshFunction } = useSessionManager();

  // Create memoized refresh function to avoid dependency issues
  // We only re-create this if refreshSession changes
  const memoizedRefreshSession = useCallback(() => {
    console.log("Memoized refresh session called");
    return refreshSession();
  }, [refreshSession]);
  
  // Use a ref to track initialization to prevent multiple initializations
  const initRef = useRef(false);

  // Register the refresh function with the session manager, only once
  useEffect(() => {
    if (initRef.current) return;
    
    console.log("Registering refresh function with session manager");
    registerRefreshFunction(memoizedRefreshSession);
    initRef.current = true;
    
    // Don't include dependencies that would cause this to run multiple times
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
