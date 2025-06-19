
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from '@/components/dealer/dashboard/DashboardLayout';
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { SimpleLiveAuctionsView } from '@/components/dealer/cars/SimpleLiveAuctionsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardTabs } from '@/hooks/useDashboardTabs';
import { QuickActions } from '@/components/dealer/QuickActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DealerDashboard = () => {
  const { user } = useAuth();
  const { dealerProfile, isLoading, error, retryFetch } = useDealerProfileSimple();
  const [activeTabRaw, setActiveTabRaw] = useState("auctions");
  const location = useLocation();
  const { toast } = useToast();
  
  // Use our custom hook to sync tab state between components
  const { activeTab, setActiveTab } = useDashboardTabs(activeTabRaw, setActiveTabRaw);
  
  // Memoize dealer name to prevent unnecessary re-renders
  const dealerName = useMemo(() => {
    return dealerProfile?.dealership_name || "Dealer";
  }, [dealerProfile?.dealership_name]);
  
  // Debug logging - only on profile state changes
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && dealerProfile) {
      console.log("Dashboard Profile State:", {
        exists: !!dealerProfile,
        id: dealerProfile?.id,
        dealership: dealerProfile?.dealership_name,
        isVerified: dealerProfile?.is_verified,
        verificationStatus: dealerProfile?.verification_status
      });
    }
  }, [dealerProfile?.id, dealerProfile?.is_verified]); // Only trigger on actual profile changes

  // Show error toast only when error changes and profile doesn't exist
  useEffect(() => {
    if (error && !dealerProfile && !isLoading) {
      toast({
        title: "Profile Loading Issue",
        description: "Having trouble loading your profile. You can try refreshing.",
        variant: "destructive",
      });
    }
  }, [error, dealerProfile, isLoading]); // Only show toast when these specific conditions change

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
        
        {/* Welcome Card - uses memoized dealer name */}
        <DealerWelcomeCard 
          dealerName={dealerName}
          isLoading={isLoading}
        />
        
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Dashboard Tabs - Simplified to 3 tabs with Live Auctions as default */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auctions">Live Auctions</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auctions">
            <div className="mt-4">
              {dealerProfile?.id ? (
                <SimpleLiveAuctionsView 
                  dealerId={dealerProfile.id}
                  dealerProfile={dealerProfile}
                  isProfileLoading={isLoading}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete your dealer profile to view live auctions.
                  </AlertDescription>
                </Alert>
              )}
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
