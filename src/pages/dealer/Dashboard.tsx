import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";
import { AuctionManagement } from "@/components/dealer/AuctionManagement";
import { ProxyBidErrors } from "@/components/dealer/ProxyBidErrors";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { DealerGuide } from "@/components/dealer/DealerGuide";

export default function DealerDashboard() {
  const [dealerId, setDealerId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getDealerProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: dealer, error } = await supabase
        .from('dealers')
        .select('id, verification_status')
        .eq('user_id', session.user.id)
        .single();

      if (error || !dealer) {
        console.error('Error fetching dealer profile:', error);
        navigate('/auth');
        return;
      }

      setDealerId(dealer.id);
    };

    getDealerProfile();
  }, [navigate]);

  if (!dealerId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <DealerHeader dealerId={dealerId} />
        <VerificationBanner dealerId={dealerId} />
        <div className="space-y-8 mt-8">
          <QuickActions />
          <AuctionManagement dealerId={dealerId} />
          <ProxyBidErrors dealerId={dealerId} />
          <DealerGuide />
        </div>
      </div>
    </div>
  );
}