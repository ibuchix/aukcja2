
import { useAuth } from "@/contexts/auth/context";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { DealerProfileOverview } from "@/components/dealer/DealerProfileOverview";
import { QuickActions } from "@/components/dealer/dashboard/QuickActions";
import { BusinessActionSection } from "@/components/dealer/dashboard/BusinessActionSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LoadingDashboard } from "@/components/dealer/dashboard/LoadingDashboard";
import { DealerProfileProvider } from "@/contexts/DealerProfileContext";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading, refreshSession } = useAuth();
  const { recentActivity, directQueryResult } = useWelcomeDashboardData(user, isAuthLoading);
  const { dealerProfile, isLoading: isProfileLoading, error: profileError } = useCurrentDealerProfile();
  const navigate = useNavigate();
  
  const handleManualRefresh = async () => {
    await refreshSession();
    window.location.reload();
  };

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return <LoadingDashboard />;
  }

  if (!user && !isLoading) {
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
    <DashboardLayout title="Dealer Dashboard">
      {profileError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Access Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{profileError}</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-fit flex items-center gap-2 mt-2"
              onClick={handleManualRefresh}
            >
              <RefreshCw className="h-4 w-4" /> Refresh Session
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
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
      
      <div className="space-y-8">
        <DealerProfileProvider>
          <DealerWelcomeCard />
        </DealerProfileProvider>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <DealerProfileOverview 
              dealerProfile={dealerProfile}
              user={user}
              isLoading={isProfileLoading}
              error={profileError}
            />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
        
        <StatsSection recentActivity={recentActivity} />
        
        <BusinessActionSection />
      </div>
    </DashboardLayout>
  );
}
