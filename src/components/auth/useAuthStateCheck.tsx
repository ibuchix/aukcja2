
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthStateCheck(returnUrl: string) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use ref to prevent immediate redirect checks
  const initialLoadCompleted = useRef(false);
  const redirectAttemptedRef = useRef(false);
  
  // Remove the auth check delay to allow faster navigation
  const [authCheckDelay, setAuthCheckDelay] = useState(false);
  
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

  // Mark initialization as complete immediately to avoid delays
  useEffect(() => {
    console.log("🔄 Auth state check initialization");
    setAuthCheckDelay(false);
    initialLoadCompleted.current = true;
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

  // Simplified redirect logic - redirect authenticated users away from auth page
  useEffect(() => {
    console.log("🔍 Auth state check - evaluating redirect conditions:");
    console.log("  - isInitialized:", isInitialized);
    console.log("  - isAuthenticated:", isAuthenticated);
    console.log("  - isLoading:", isLoading);
    console.log("  - forceShowLogin:", forceShowLogin);
    console.log("  - redirectAttempted:", redirectAttemptedRef.current);
    
    // Skip if not initialized or force login is set
    if (!isInitialized || forceShowLogin) {
      console.log("❌ Skipping redirect - not initialized or force login set");
      return;
    }
    
    // If user is authenticated and not loading, redirect away from auth page
    if (isAuthenticated && !isLoading && !redirectAttemptedRef.current) {
      console.log("✅ User is authenticated - redirecting away from auth page to:", returnUrl);
      redirectAttemptedRef.current = true;
      setRedirectAttempted(true);
      
      // Navigate immediately
      navigate(returnUrl, { replace: true });
    } else if (isInitialized && !isLoading && !isAuthenticated) {
      console.log("ℹ️ User not authenticated - staying on auth page");
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
