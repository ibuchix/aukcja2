
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { DealerProfileProvider } from '@/contexts/dealer-profile';
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
import { AlertCircle, RefreshCw, FileText, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDealerProfile } from "@/contexts/dealer-profile";

const DashboardContent = () => {
  const { user } = useAuth();
  const { displayProfile, isLoading, error, refreshProfile } = useDealerProfile();
  const [activeTabRaw, setActiveTabRaw] = useState("auctions");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use our custom hook to sync tab state between components
  const { activeTab, setActiveTab } = useDashboardTabs(activeTabRaw, setActiveTabRaw);
  
  // Check if dealer is verified - using correct property names
  const isVerified = displayProfile?.verification_status === 'approved' || displayProfile?.is_verified === true;
  
  // Memoized dealer name to prevent unnecessary re-renders - using correct property name
  const dealerName = useMemo(() => {
    return displayProfile?.dealership_name || "Dealer";
  }, [displayProfile?.dealership_name]);
  
  // Debug logging - only on profile state changes
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log("Dashboard Profile State:", {
        exists: !!displayProfile,
        id: displayProfile?.id,
        dealership: displayProfile?.dealership_name,
        supervisorName: displayProfile?.supervisor_name,
        isVerified: displayProfile?.is_verified,
        verificationStatus: displayProfile?.verification_status,
        user: user?.id,
        isLoading,
        error
      });
    }
  }, [displayProfile, user?.id, isLoading, error]);

  // Show error toast only when error changes and profile doesn't exist
  useEffect(() => {
    if (error && !displayProfile && !isLoading) {
      toast({
        title: "Profile Loading Issue",
        description: "Having trouble loading your profile. You can try refreshing.",
        variant: "destructive",
      });
    }
  }, [error, displayProfile, isLoading, toast]);

  return (
    <DashboardLayout title="Dealer Dashboard">
      <div className="space-y-6">
        {/* Show error if profile failed to load */}
        {error && !displayProfile && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Loading Error</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{error}</p>
              <Button onClick={refreshProfile} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading Profile
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Banner for Unverified Dealers */}
        {displayProfile && !isVerified && (
          <Alert className="border-[#DC143C]/20 bg-[#DC143C]/5">
            <Building2 className="h-4 w-4 text-[#DC143C]" />
            <AlertTitle className="text-[#DC143C]">Account Verification Required</AlertTitle>
            <AlertDescription className="text-[#DC143C]/80">
              <p className="mb-3">
                To access all platform features and start bidding on auctions, please complete your account verification by uploading your company's utility bill.
              </p>
              <Button 
                onClick={() => navigate('/dealer/documents')}
                className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Go to Documents
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
        
        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auctions">Live Auctions</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auctions">
            <div className="mt-4">
              {displayProfile?.id ? (
                <SimpleLiveAuctionsView />
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

const DealerDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <DashboardLayout title="Dealer Dashboard">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access your dashboard.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DealerProfileProvider>
      <DashboardContent />
    </DealerProfileProvider>
  );
};

export default DealerDashboard;
