
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/loader";
import { useEffect, useState } from "react";

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
      console.log("Protected route: Auth initialization complete, marking check as done");
      setAuthCheckComplete(true);
    }
  }, [isInitialized, isLoading, authCheckComplete]);

  // Reduced safety timeout for faster response
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.warn("Protected route safety timeout triggered - forcing auth check completion");
        setAuthCheckComplete(true);
      }
    }, 1000); // Reduced from 2000ms
    
    return () => clearTimeout(safetyTimeout);
  }, [authCheckComplete]);

  // Handle redirection with minimal delay
  useEffect(() => {
    if (authCheckComplete && !isAuthenticated && !isLoading && !session) {
      console.log("Protected route: User not authenticated, preparing redirect");
      const redirectTimer = setTimeout(() => {
        setIsRedirecting(true);
      }, 50); // Reduced delay
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authCheckComplete, isAuthenticated, isLoading, session]);

  // Show loading state during initialization or while auth is loading
  if (!authCheckComplete || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  // If user is not authenticated after auth check is complete, redirect to auth page
  if ((!isAuthenticated || !session) && authCheckComplete && !isLoading) {
    if (isRedirecting) {
      console.log("Protected route: Redirecting to auth page");
      return <Navigate to="/auth" replace state={{ returnUrl: location.pathname }} />;
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
