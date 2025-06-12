
import { useAuthInitializer } from "./hooks/useAuthInitializer";
import { useAuthStateListener } from "./hooks/useAuthStateListener";
import { useLoadingSafety } from "./hooks/useLoadingSafety";
import { useState, useEffect } from "react";

/**
 * Main hook for managing authentication state
 */
export function useAuthState() {
  // Add initialization flag to prevent multiple initializations
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize auth state and check for existing session
  const {
    session,
    user,
    profile,
    isLoading,
    setSession,
    setUser,
    setProfile,
    setIsLoading,
    initializationComplete
  } = useAuthInitializer();

  // Set up auth state change listener
  useAuthStateListener(setSession, setUser, setProfile, setIsLoading);
  
  // Safety timeout to prevent endless loading state
  useLoadingSafety(isLoading, setIsLoading);
  
  // Mark as initialized when initialization is complete
  useEffect(() => {
    if (initializationComplete && !isInitialized) {
      console.log("Auth state initialization complete");
      setIsInitialized(true);
    }
  }, [initializationComplete, isInitialized]);

  return {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    setProfile,
    setSession,
    setUser,
    setIsLoading
  };
}
