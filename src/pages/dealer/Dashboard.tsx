import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";
import { AuctionManagement } from "@/components/dealer/AuctionManagement";
import { AuctionAnalytics } from "@/components/dealer/AuctionAnalytics";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { supabase } from "@/integrations/supabase/client";

interface DealerProfile {
  dealership_name: string;
  address: string | null;
  license_number: string;
  verification_status: string;
}

const Dashboard = () => {
  const user = useUser();
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);

  useEffect(() => {
    const fetchDealerProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('dealers')
          .select('dealership_name, address, license_number, verification_status')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setDealerProfile(data);
        }
      }
    };

    fetchDealerProfile();
  }, [user]);

  if (!user || !dealerProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <VerificationBanner verificationStatus={dealerProfile.verification_status} />
      <DealerHeader dealerProfile={dealerProfile} />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuctionAnalytics dealerId={user.id} />
        <AuctionManagement dealerId={user.id} />
      </div>
    </div>
  );
};

export default Dashboard;