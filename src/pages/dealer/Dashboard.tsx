
import React, { useState } from 'react';
import { useDealerProfile } from "@/contexts/dealer-profile";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from '@/components/dealer/dashboard/DashboardLayout';
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { DealerProfile } from "@/components/dealer/DealerProfile";
import { CarSearch } from '@/components/dealer/cars/CarSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardTabs } from '@/hooks/useDashboardTabs';

const DealerDashboard = () => {
  const { user } = useAuth();
  const { displayProfile, isLoading } = useDealerProfile();
  const [activeTabRaw, setActiveTabRaw] = useState("overview");
  
  // Use our custom hook to sync tab state between components
  const { activeTab, setActiveTab } = useDashboardTabs(activeTabRaw, setActiveTabRaw);

  return (
    <DashboardLayout title="Dealer Dashboard">
      <div className="space-y-6">
        {/* Dealer Profile Information - handles its own loading/error states */}
        <DealerProfile />
        
        {/* Welcome Card - uses data from centralized profile provider */}
        <DealerWelcomeCard 
          dealerName={displayProfile?.dealership_name || "Dealer"}
          isLoading={isLoading}
        />
        
        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cars">Car Search</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview Section */}
            <StatsSection />
          </TabsContent>
          
          <TabsContent value="cars">
            {/* Car Search Component */}
            {displayProfile && (
              <CarSearch dealerId={displayProfile.id} />
            )}
          </TabsContent>
          
          <TabsContent value="profile">
            {/* Profile Information Section */}
            <ProfileInfoSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DealerDashboard;
