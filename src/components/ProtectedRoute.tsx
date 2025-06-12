
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

  // Mark auth check complete when initialization is done and not loading
  useEffect(() => {
    if (isInitialized && !isLoading && !authCheckComplete) {
      console.log("Auth initialization complete and not loading, marking check as done");
      setAuthCheckComplete(true);
    }
  }, [isInitialized, isLoading, authCheckComplete]);

  // Add a safety timeout to prevent endless loading
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.warn("Protected route safety timeout triggered - forcing auth check completion");
        setAuthCheckComplete(true);
        sessionCircuitBreaker.reset();
      }
    }, 3000); // Reduced from 2000ms to 3000ms for better reliability
    
    return () => clearTimeout(safetyTimeout);
  }, [authCheckComplete]);

  // Handle redirection with a slight delay to avoid flashing
  useEffect(() => {
    if (authCheckComplete && !isAuthenticated && !isLoading) {
      console.log("User not authenticated after auth check complete, preparing redirect");
      const redirectTimer = setTimeout(() => {
        setIsRedirecting(true);
      }, 200);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authCheckComplete, isAuthenticated, isLoading]);

  // Show loading state during initialization or while auth is loading
  if (!authCheckComplete || (!authCheckComplete && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  // If user is not authenticated after auth check is complete, redirect to auth page
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
