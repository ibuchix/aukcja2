import { useAuth } from "@/contexts/AuthContext";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { QuickActions } from "@/components/dealer/dashboard/QuickActions";
import { BusinessActionSection } from "@/components/dealer/dashboard/BusinessActionSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LoadingDashboard } from "@/components/dealer/dashboard/LoadingDashboard";
import { supabase } from "@/integrations/supabase/client";
import { DealerProfileProvider } from "@/contexts/DealerProfileContext";
import { DealerProfile } from "@/components/dealer/DealerProfile";
import { DealerAnalyticsDashboard } from "@/components/dealer/analytics/DealerAnalyticsDashboard";
import { AdminTools } from "@/components/dealer/dashboard/AdminTools";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { WatchlistManagement } from "@/components/dealer/dashboard/WatchlistManagement";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading, refreshSession } = useAuth();
  const { recentActivity, directQueryResult } = useWelcomeDashboardData(user, isAuthLoading);
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const { dealerProfile } = useCurrentDealerProfile();
  const dealerId = dealerProfile?.id || '';

  useEffect(() => {
    const debugRls = async () => {
      if (user) {
        console.log("DealerDashboard - Current auth state:", { 
          userExists: !!user,
          userId: user.id,
          userEmail: user.email
        });
        
        try {
          const { data: jwtData, error: jwtError } = await supabase
            .rpc('debug_auth_user_id');
          
          console.log("JWT Auth Claim Check:", {
            success: !jwtError,
            jwtUserId: jwtData,
            matchesCurrentUser: user.id === jwtData,
            error: jwtError?.message
          });
          
          const { data: { session } } = await supabase.auth.getSession();
          console.log("Session check:", {
            hasSession: !!session,
            hasAccessToken: !!session?.access_token,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            tokenType: session?.token_type
          });
        } catch (err) {
          console.error("Error in RLS debug queries:", err);
        }
      }
    };
    
    debugRls();
  }, [user]);

  const handleManualRefresh = async () => {
    await refreshSession();
    window.location.reload();
  };

  if (isAuthLoading) {
    return <LoadingDashboard />;
  }

  if (!user && !isAuthLoading) {
    return (
      <DashboardLayout title="Authentication Required">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to access the dealer dashboard.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full md:w-auto"
        >
          Go to Login
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DealerProfileProvider>
      <DashboardLayout title={isAdmin ? "Admin Dashboard" : "Dealer Dashboard"}>
        {directQueryResult && (
          <Alert variant={directQueryResult.success ? "default" : "destructive"} className="mb-6">
            {directQueryResult.success ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <AlertCircle className="h-4 w-4" />
            }
            <AlertTitle>
              {directQueryResult.success ? "Direct Query Test Passed" : "Direct Query Test Failed"}
            </AlertTitle>
            <AlertDescription>
              {directQueryResult.message}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="col-span-2">
            <DealerWelcomeCard />
          </div>
          <div className="space-y-8">
            {/* Admin tools visible only to admins */}
            <PermissionGate action="manage" entityType="dealer">
              <AdminTools />
            </PermissionGate>
            
            <DealerProfile />
            
            <QuickActions />
            
            <DealerAnalyticsDashboard />
            
            <StatsSection recentActivity={recentActivity} />
            
            <WatchlistManagement dealerId={dealerId} />
            
            <BusinessActionSection />
          </div>
        </div>
      </DashboardLayout>
    </DealerProfileProvider>
  );
}
