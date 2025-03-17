
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

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/login');
          return;
        }

        const profileData = await fetchDealerProfile(session.user.id);
        setProfile(profileData);
      } catch (error: any) {
        setError(error.message || "Failed to fetch profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);
  
  return (
    <>
      {profile && profile.id && (
        <AuctionNotificationHandler dealerId={profile.id} />
      )}
      
      <DashboardLayout>
        {profile && !profile.is_verified && (
          <VerificationBanner verificationStatus={profile.verification_status || 'pending'} />
        )}
        <DealerHeader profile={profile} isLoading={isLoading} error={error} />
        <MainDashboard profile={profile} isLoading={isLoading} error={error} />
        
        {/* Add our new auction browser component */}
        {profile && profile.id && (
          <div className="mt-8">
            <DealerAuctionBrowser dealerId={profile.id} />
          </div>
        )}
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
