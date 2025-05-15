
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, session } = useAuth();
  const location = useLocation();

  // Wait for initialization to complete
  if (!isInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!isAuthenticated || !session) {
    // Redirect to auth page with return URL
    return <Navigate to="/auth?tab=login" replace state={{ returnUrl: location.pathname }} />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}
