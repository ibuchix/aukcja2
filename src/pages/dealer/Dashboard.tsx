
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
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/auth');
          return;
        }

        try {
          const profileData = await fetchDealerProfile(session.user.id);
          setProfile(profileData);
          
          // Check if we need to complete registration
          if (!profileData || !profileData.dealer) {
            console.log("No dealer profile found, may need to complete registration");
            setProfileError(true);
          }
        } catch (error: any) {
          console.error("Failed to fetch profile:", error);
          setError(error.message || "Failed to fetch profile");
          setProfileError(true);
        }
      } catch (error: any) {
        setError(error.message || "Failed to fetch session");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  // Handle case where dealer profile needs to be created
  if (profileError && !isLoading) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="mx-auto max-w-2xl mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Profile Not Complete</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Your dealer profile is not complete or has not been properly set up.</p>
            <Button onClick={() => navigate('/complete-registration')}>
              Complete Registration
            </Button>
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
