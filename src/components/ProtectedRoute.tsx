
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/loader";
import { useEffect, useState } from "react";
import { sessionCircuitBreaker } from "@/utils/sessionCircuitBreaker";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, session } = useAuth();
  const location = useLocation();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Add a delayed safety check to prevent endless loading
  useEffect(() => {
    // If we're still loading after 2 seconds, we might be stuck
    const safetyTimeout = setTimeout(() => {
      if (isLoading && !authCheckComplete) {
        console.warn("Auth check taking too long, forcing completion");
        setAuthCheckComplete(true);
        
        // Reset circuit breaker
        sessionCircuitBreaker.reset();
      }
    }, 2000);
    
    return () => clearTimeout(safetyTimeout);
  }, [isLoading, authCheckComplete]);

  // Mark auth check complete when initialization is done
  useEffect(() => {
    if (isInitialized && !authCheckComplete) {
      console.log("Auth initialization complete, marking check as done");
      setAuthCheckComplete(true);
    }
  }, [isInitialized, authCheckComplete]);

  // Handle redirection with a slight delay to avoid flashing
  useEffect(() => {
    if (authCheckComplete && !isAuthenticated && !isLoading) {
      console.log("User not authenticated, preparing redirect");
      // Prevent immediate redirect to avoid UI flashing
      const redirectTimer = setTimeout(() => {
        setIsRedirecting(true);
      }, 200);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authCheckComplete, isAuthenticated, isLoading]);

  // Show loading state during initialization
  if ((!authCheckComplete && isLoading) || (!authCheckComplete && !isInitialized)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to auth page
  if ((!isAuthenticated || !session) && authCheckComplete) {
    if (isRedirecting) {
      // Redirect to auth page with return URL
      return <Navigate to="/auth?tab=login" replace state={{ returnUrl: location.pathname }} />;
    }
    
    // Show brief loading state before redirect
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}
