import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";

interface DealerProfile {
  dealership_name: string;
  license_number: string;
  address: string | null;
  verification_status: string;
}

const DealerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        navigate('/auth');
        return;
      }

      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (dealerError) {
        console.error('Error fetching dealer profile:', dealerError);
        navigate('/auth');
        return;
      }

      if (!dealerData) {
        console.error('No dealer profile found');
        navigate('/auth');
        return;
      }

      setDealerProfile(dealerData);
      setLoading(false);

      if (dealerData.verification_status === 'pending') {
        toast({
          title: "Account Pending Verification",
          description: "Your account is currently under review. You'll be notified once verified.",
          variant: "default",
        });
      }
    };

    checkAuthAndProfile();
  }, [navigate, toast]);

  if (loading || !dealerProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <VerificationBanner verificationStatus={dealerProfile.verification_status} />
        <DealerHeader dealerProfile={dealerProfile} />
        <QuickActions />
      </div>
    </div>
  );
};

export default DealerDashboard;