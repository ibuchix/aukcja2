
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { dealerProfile, recentActivity, profileDataLoading } = useWelcomeDashboardData(user, isAuthLoading);

  // Combined loading state
  const isLoading = isAuthLoading || profileDataLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dealer Dashboard</h1>
        
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
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
            
            <StatsSection recentActivity={recentActivity} />
          </>
        )}
      </div>
    </div>
  );
}
