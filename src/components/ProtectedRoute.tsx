
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

  // Mark auth check complete when initialization is done and not loading
  useEffect(() => {
    if (isInitialized && !isLoading) {
      console.log("Protected route: Auth initialization complete");
      setAuthCheckComplete(true);
    }
  }, [isInitialized, isLoading]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.warn("Protected route safety timeout triggered");
        setAuthCheckComplete(true);
      }
    }, 2000);
    
    return () => clearTimeout(safetyTimeout);
  }, [authCheckComplete]);

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
  if (!isAuthenticated || !session) {
    console.log("Protected route: User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" replace state={{ returnUrl: location.pathname }} />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}
