
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";

export default function DealerDashboard() {
  const { user, isLoading } = useAuth();
  const { dealerProfile, recentActivity, profileDataLoading } = useWelcomeDashboardData(user, isLoading);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dealer Dashboard</h1>
        
        <DealerWelcomeCard 
          dealerName={dealerProfile?.supervisor_name}
          isLoading={profileDataLoading}
        />
        
        <ProfileInfoSection 
          dealerProfile={dealerProfile}
          user={user}
          isLoading={profileDataLoading}
        />
        
        <StatsSection recentActivity={recentActivity} />
      </div>
    </div>
  );
}
