
import { useAuth } from "@/contexts/AuthContext";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { QuickActions } from "@/components/dealer/dashboard/QuickActions";
import { BusinessActionSection } from "@/components/dealer/dashboard/BusinessActionSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LoadingDashboard } from "@/components/dealer/dashboard/LoadingDashboard";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { dealerProfile, recentActivity, profileDataLoading } = useWelcomeDashboardData(user, isAuthLoading);
  const navigate = useNavigate();
  
  // Add debug logging
  useEffect(() => {
    console.log("DealerDashboard state:", { 
      userExists: !!user,
      dealerProfileExists: !!dealerProfile,
      isAuthLoading,
      profileDataLoading,
      userData: user,
      profileData: dealerProfile
    });
  }, [user, dealerProfile, isAuthLoading, profileDataLoading]);

  // Determine if we're still in a loading state
  const isLoading = isAuthLoading || profileDataLoading;

  // If we're not loading and there's no dealer profile, we need to handle this case
  const noProfileFound = !dealerProfile && !!user && !isLoading;

  // Show loading state
  if (isLoading) {
    return <LoadingDashboard />;
  }

  return (
    <DashboardLayout title="Dealer Dashboard">
      {noProfileFound ? (
        <div className="space-y-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription>
              We couldn't find your dealer profile. You may need to complete your registration.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/complete-registration')}
            className="w-full md:w-auto"
          >
            Complete Registration
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <DealerWelcomeCard 
            dealerName={dealerProfile?.supervisor_name || user?.email?.split('@')[0] || "Dealer"}
            dealershipName={dealerProfile?.dealership_name || "Your Dealership"}
            isLoading={false}
          />
          
          <ProfileInfoSection 
            dealerProfile={dealerProfile}
            user={user}
            isLoading={false}
          />
          
          <QuickActions />
          
          <StatsSection recentActivity={recentActivity} />
          
          <BusinessActionSection />
        </div>
      )}
    </DashboardLayout>
  );
}
