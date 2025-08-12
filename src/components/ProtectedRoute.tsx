
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/loader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [dealerCheckComplete, setDealerCheckComplete] = useState(false);
  const [isDealer, setIsDealer] = useState<boolean | null>(null);

  // Mark auth check complete when initialization is done and not loading
  useEffect(() => {
    if (isInitialized && !isLoading) {
      console.log("Protected route: Auth initialization complete");
      setAuthCheckComplete(true);
    }
  }, [isInitialized, isLoading]);

  // After auth check, verify dealer status for authenticated users
  useEffect(() => {
    const verifyDealer = async () => {
      if (session?.user) {
        try {
          const { data: dealerId, error } = await supabase.rpc('get_dealer_profile_id');
          if (error) {
            console.warn('Dealer verification RPC error:', error);
          }
          setIsDealer(!!dealerId);
        } catch (e) {
          console.error('Dealer verification failed:', e);
          setIsDealer(false);
        } finally {
          setDealerCheckComplete(true);
        }
      } else {
        // Not authenticated; no dealer check needed
        setDealerCheckComplete(true);
      }
    };

    if (authCheckComplete) {
      verifyDealer();
    }
  }, [authCheckComplete, session]);

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

  // Show loading state during initialization or while auth is loading or dealer check pending
  if (!authCheckComplete || isLoading || (!dealerCheckComplete && isAuthenticated)) {
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

  // Enforce dealer-only access
  if (dealerCheckComplete && isAuthenticated && session && isDealer === false) {
    toast({
      title: 'Dealer account required',
      description: 'This app is restricted to dealer accounts. Please register as a dealer.',
      variant: 'destructive',
    });
    return <Navigate to="/auth" replace state={{ returnUrl: location.pathname }} />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}
