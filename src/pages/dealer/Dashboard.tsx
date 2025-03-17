
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainDashboard } from "@/components/dealer/dashboard/MainDashboard";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchDealerProfile } from "@/contexts/auth/authUtils";
import { AuctionNotificationHandler } from "@/components/auction/AuctionNotificationHandler";

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
        <DealerHeader profile={profile} isLoading={isLoading} error={error} />
        <MainDashboard profile={profile} isLoading={isLoading} error={error} />
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
