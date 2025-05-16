
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { MainDashboard } from "@/components/dealer/dashboard/MainDashboard";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchDealerProfile } from "@/contexts/auth/authUtils";
import { AuctionNotificationHandler } from "@/components/auction/AuctionNotificationHandler";
import { DealerAuctionBrowser } from "@/components/dealer/auction/DealerAuctionBrowser";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  const fetchProfile = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      // Get and check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("No session found, redirecting to auth");
        navigate('/auth');
        return;
      }

      // Force a session refresh if requested 
      if (forceRefresh) {
        console.log("Forcing session refresh before profile fetch");
        await refreshSession();
        // Get the fresh session again
        const { data: refreshData } = await supabase.auth.getSession();
        if (!refreshData.session) {
          console.log("Failed to refresh session, redirecting to auth");
          navigate('/auth');
          return;
        }
      }

      try {
        // Fetch profile with the current or refreshed session
        const profileData = await fetchDealerProfile(session.user.id);
        console.log("Profile fetch result:", profileData ? "Success" : "Failed");
        setProfile(profileData);
        
        // Check if we need to complete registration
        if (!profileData || !profileData.dealer) {
          console.log("No dealer profile found, may need to complete registration");
          setProfileError(true);
        } else {
          console.log("Dealer profile loaded successfully:", profileData.dealer.id);
        }
      } catch (error: any) {
        console.error("Failed to fetch profile:", error);
        setError(error.message || "Failed to fetch profile");
        setProfileError(true);
        
        // If we haven't retried yet and it's likely a permission issue, try refresh & retry
        if (retryCount === 0 && error.message && error.message.includes("permission denied")) {
          console.log("Permission error detected, will retry after session refresh");
          setRetryCount(prev => prev + 1);
          await fetchProfile(true); // Retry with forced refresh
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch session");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate, toast]);

  // Handle manual retry
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    await fetchProfile(true); // Force refresh on manual retry
    toast({
      title: "Refreshing your profile",
      description: "Attempting to load your profile data again."
    });
  };

  // Handle case where dealer profile needs to be created
  if (profileError && !isLoading) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="mx-auto max-w-2xl mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Profile Not Complete</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Your dealer profile is not complete or has not been properly set up.</p>
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground">
                We tried to refresh your session automatically. You can try again or complete registration.
              </p>
            )}
            <div className="flex gap-4">
              <Button onClick={() => navigate('/complete-registration')}>
                Complete Registration
              </Button>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry Loading Profile
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }
  
  return (
    <>
      {profile && profile.dealer && profile.dealer.id && (
        <AuctionNotificationHandler dealerId={profile.dealer.id} />
      )}
      
      <DashboardLayout>
        {profile && profile.dealer && !profile.dealer.is_verified && (
          <VerificationBanner verificationStatus={profile.dealer.verification_status || 'pending'} />
        )}
        <DealerHeader profile={profile} isLoading={isLoading} error={error} />
        <MainDashboard profile={profile} isLoading={isLoading} error={error} />
        
        {/* Add our auction browser component only if we have a dealer profile */}
        {profile && profile.dealer && profile.dealer.id && (
          <div className="mt-8">
            <DealerAuctionBrowser dealerId={profile.dealer.id} />
          </div>
        )}
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
