
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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

  // Component definitions for reordering
  const errorAlert = error && !displayProfile && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd ładowania profilu</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{error}</p>
        <Button onClick={refreshProfile} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Ponów ładowanie profilu
        </Button>
      </AlertDescription>
    </Alert>
  );

  const verificationBanner = displayProfile && !isVerified && (
    <Alert className="border-[#DC143C]/20 bg-[#DC143C]/5">
      <Building2 className="h-4 w-4 text-[#DC143C]" />
      <AlertTitle className="text-[#DC143C]">Wymagana weryfikacja konta</AlertTitle>
      <AlertDescription className="text-[#DC143C]/80">
        <p className="mb-3">
          Aby uzyskać dostęp do wszystkich funkcji platformy i rozpocząć licytację na aukcjach, prosimy o dokończenie weryfikacji konta poprzez przesłanie rachunku za media Twojej firmy.
        </p>
        <Button 
          onClick={() => navigate('/dealer/documents')}
          className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Przejdź do dokumentów
        </Button>
      </AlertDescription>
    </Alert>
  );

  const welcomeCard = (
    <DealerWelcomeCard 
      dealerName={dealerName}
      isLoading={isLoading}
    />
  );

  const quickActions = <QuickActions />;
  
  const tabsSection = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="auctions">
          {isMobile ? "Aukcja" : "Aukcja na żywo"}
        </TabsTrigger>
        <TabsTrigger value="overview">Przegląd</TabsTrigger>
        <TabsTrigger value="profile">Profil</TabsTrigger>
      </TabsList>
      
      <TabsContent value="auctions">
        <div className="mt-4">
          {displayProfile?.id ? (
            <SimpleLiveAuctionsView />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Prosimy o dokończenie profilu dealera, aby wyświetlić aukcje na żywo.
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
  );

  return (
    <DashboardLayout title="Aukcja">
      <div className={isMobile ? "space-y-4" : "space-y-6"}>
        {/* Always show errors and verification banner first */}
        {errorAlert}
        {verificationBanner}
        
        {/* Mobile: Quick actions, welcome card, then tabs */}
        {/* Desktop: Welcome card first, then quick actions and tabs */}
        {isMobile ? (
          <>
            {quickActions}
            {welcomeCard}
            {tabsSection}
          </>
        ) : (
          <>
            {welcomeCard}
            {quickActions}
            {tabsSection}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const DealerDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <DashboardLayout title="Aukcja">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Prosimy zalogować się, aby uzyskać dostęp do panelu.
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
