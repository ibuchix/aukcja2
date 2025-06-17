
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthStateCheck(returnUrl: string) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use ref to prevent immediate redirect checks
  const initialLoadCompleted = useRef(false);
  const redirectAttemptedRef = useRef(false);
  
  // Reduce the auth check delay to minimal to allow faster navigation
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

  // Reduce delay to allow faster navigation after successful login
  useEffect(() => {
    console.log("Setting up minimal auth check delay");
    const timer = setTimeout(() => {
      console.log("Minimal auth check delay completed");
      setAuthCheckDelay(false);
      initialLoadCompleted.current = true;
    }, 200); // Reduced from 3000ms to 200ms
    
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

  // Simplified redirect logic - allow navigation when user is authenticated
  useEffect(() => {
    // Skip if not initialized or force login is set
    if (!isInitialized || forceShowLogin) {
      return;
    }
    
    // Only proceed with redirect if fully authenticated and not loading
    if (isAuthenticated && !isLoading && !redirectAttemptedRef.current) {
      console.log("Auth check: User authenticated, redirecting to:", returnUrl);
      redirectAttemptedRef.current = true;
      setRedirectAttempted(true);
      
      // Navigate immediately without delay
      navigate(returnUrl, { replace: true });
    } else if (isInitialized && !isLoading && !isAuthenticated) {
      console.log("Auth check: No authenticated user found");
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate, returnUrl, forceShowLogin]);

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
