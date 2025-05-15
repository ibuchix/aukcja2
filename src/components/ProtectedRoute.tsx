
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

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
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    // Redirect to auth page with return URL
    return <Navigate to="/auth?tab=login" replace state={{ returnUrl: location.pathname }} />;
  }

  return <>{children}</>;
}
