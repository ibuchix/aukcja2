
import { useAuth } from "@/contexts/AuthContext";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { LoadingDashboard } from "@/components/dealer/dashboard/LoadingDashboard";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { QuickActions } from "@/components/dealer/dashboard/QuickActions";
import { BusinessActionSection } from "@/components/dealer/dashboard/BusinessActionSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { dealerProfile, recentActivity, profileDataLoading } = useWelcomeDashboardData(user, isAuthLoading);

  // Combined loading state
  const isLoading = isAuthLoading || profileDataLoading;

  return (
    <DashboardLayout title="Dealer Dashboard">
      {isLoading ? (
        <LoadingDashboard />
      ) : (
        <div className="space-y-8">
          <DealerWelcomeCard 
            dealerName={dealerProfile?.supervisor_name}
            dealershipName={dealerProfile?.dealership_name}
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
