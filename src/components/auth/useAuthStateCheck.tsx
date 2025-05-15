
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthStateCheck(returnUrl: string) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use ref to prevent immediate redirect checks
  const initialLoadCompleted = useRef(false);
  const redirectAttemptedRef = useRef(false);
  
  // Significantly increase the auth check delay to ensure form is fully loaded
  const [authCheckDelay, setAuthCheckDelay] = useState(true);
  
  const [authContext, authError] = (() => {
    try {
      const ctx = useAuth();
      return [ctx, null];
    } catch (error) {
      console.error("Auth context error:", error);
      return [{ isAuthenticated: false, isLoading: false, isInitialized: false }, error];
    }
  })();
  
  const { isAuthenticated, isLoading, isInitialized } = authContext;
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Force URL parameter-based override to prevent redirect
  const forceShowLogin = searchParams.has("force_login");

  // Add significant delay before checking auth to allow form interaction
  useEffect(() => {
    console.log("Setting up auth check delay");
    const timer = setTimeout(() => {
      console.log("Auth check delay completed");
      setAuthCheckDelay(false);
      initialLoadCompleted.current = true;
    }, 3000); // Increased to 3 seconds to ensure form load
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading]);

  // Modified to prevent immediate redirect with multiple safeguards
  useEffect(() => {
    // Skip if any of these conditions are true
    if (!isInitialized || 
        !initialLoadCompleted.current || 
        authCheckDelay || 
        redirectAttemptedRef.current || 
        forceShowLogin) {
      return;
    }
    
    // Only proceed with redirect if fully authenticated and initialization is complete
    if (isAuthenticated && !isLoading) {
      console.log("Auth initialization complete, user authenticated, redirecting to:", returnUrl);
      redirectAttemptedRef.current = true;
      setRedirectAttempted(true);
      
      // Add small delay before navigation to prevent immediate jumps
      setTimeout(() => {
        navigate(returnUrl);
      }, 100);
    } else if (isInitialized && !isLoading && !isAuthenticated) {
      console.log("Auth initialization complete, no authenticated user found");
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate, redirectAttempted, returnUrl, authCheckDelay, forceShowLogin]);

  const forceLoginFormDisplay = () => {
    // Add force_login parameter and reload
    const newParams = new URLSearchParams(searchParams);
    newParams.set("force_login", "true");
    newParams.set("tab", "login");
    window.location.href = `/auth?${newParams.toString()}`;
  };

  return {
    authError,
    isLoading,
    isAuthenticated,
    isInitialized,
    authCheckDelay,
    loadingTimeout,
    forceShowLogin,
    forceLoginFormDisplay
  };
}
