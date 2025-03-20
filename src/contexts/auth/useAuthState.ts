
import { useAuthInitializer } from "./hooks/useAuthInitializer";
import { useAuthStateListener } from "./hooks/useAuthStateListener";
import { useLoadingSafety } from "./hooks/useLoadingSafety";

/**
 * Main hook for managing authentication state
 */
export function useAuthState() {
  // Initialize auth state and check for existing session
  const {
    session,
    user,
    profile,
    isLoading,
    setSession,
    setUser,
    setProfile,
    setIsLoading
  } = useAuthInitializer();

  // Set up auth state change listener
  useAuthStateListener(setSession, setUser, setProfile, setIsLoading);
  
  // Safety timeout to prevent endless loading state
  useLoadingSafety(isLoading, setIsLoading);

  return {
    session,
    user,
    profile,
    isLoading,
    setProfile,
    setSession,
    setUser,
    setIsLoading
  };
}
