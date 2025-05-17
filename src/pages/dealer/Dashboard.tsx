
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { QuickActions } from '@/components/dealer/dashboard/QuickActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const DealerDashboard = () => {
  const { user } = useAuth();
  const { displayProfile, isLoading, error, profileStatus } = useDealerProfile();
  // Set car search as default active tab
  const [activeTabRaw, setActiveTabRaw] = useState("cars");
  const location = useLocation();
  
  // Use our custom hook to sync tab state between components
  const { activeTab, setActiveTab } = useDashboardTabs(activeTabRaw, setActiveTabRaw);
  
  // For debugging purposes
  useEffect(() => {
    if (displayProfile) {
      console.log("Dealer Profile loaded:", {
        id: displayProfile.id,
        dealership: displayProfile.dealership_name,
        userId: user?.id
      });
    } else {
      console.log("No dealer profile available. Profile status:", profileStatus);
    }
  }, [displayProfile, user, profileStatus]);

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
        
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cars">Car Search</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cars">
            {/* Car Search Component - always render it but let it handle missing dealer ID */}
            <div className="mt-4">
              <CarSearch dealerId={displayProfile?.id} />
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview Section */}
            <StatsSection />
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
