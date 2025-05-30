
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from '@/components/dealer/dashboard/DashboardLayout';
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { CarSearchWrapper } from '@/components/dealer/cars/CarSearchWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardTabs } from '@/hooks/useDashboardTabs';
import { QuickActions } from '@/components/dealer/dashboard/QuickActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

const DealerDashboard = () => {
  const { user } = useAuth();
  const { dealerProfile, isLoading, error, retryFetch } = useDealerProfileSimple();
  const [activeTabRaw, setActiveTabRaw] = useState("cars");
  const location = useLocation();
  
  // Use our custom hook to sync tab state between components
  const { activeTab, setActiveTab } = useDashboardTabs(activeTabRaw, setActiveTabRaw);
  
  // For debugging purposes
  useEffect(() => {
    if (dealerProfile) {
      console.log("Dealer Profile loaded:", {
        id: dealerProfile.id,
        dealership: dealerProfile.dealership_name,
        userId: user?.id
      });
    } else if (!isLoading) {
      console.log("No dealer profile available");
    }
  }, [dealerProfile, user, isLoading]);

  return (
    <DashboardLayout title="Dealer Dashboard">
      <div className="space-y-6">
        {/* Show error if profile failed to load */}
        {error && !dealerProfile && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Loading Error</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{error}</p>
              <Button onClick={retryFetch} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading Profile
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Welcome Card - uses data from profile hook */}
        <DealerWelcomeCard 
          dealerName={dealerProfile?.dealership_name || "Dealer"}
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
            <div className="mt-4">
              <CarSearchWrapper />
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-6">
            <StatsSection />
          </TabsContent>
          
          <TabsContent value="profile">
            <ProfileInfoSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DealerDashboard;
