
import React from 'react';
import { useDealerProfile } from "@/contexts/dealer-profile";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from '@/components/dealer/dashboard/DashboardLayout';
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { DealerProfile } from "@/components/dealer/DealerProfile";

const DealerDashboard = () => {
  const { user } = useAuth();
  const { displayProfile, isLoading, error, profileStatus } = useDealerProfile();

  return (
    <DashboardLayout title="Dealer Dashboard">
      <div className="space-y-6">
        {/* Dealer Profile Information */}
        <DealerProfile />
        
        {/* Welcome Card */}
        <DealerWelcomeCard 
          dealerName={displayProfile?.dealership_name || "Dealer"}
          isLoading={isLoading}
        />
        
        {/* Stats Overview Section */}
        <StatsSection />
        
        {/* Profile Information Section */}
        <ProfileInfoSection />
      </div>
    </DashboardLayout>
  );
};

export default DealerDashboard;
