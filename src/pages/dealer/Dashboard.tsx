
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";
import { AuctionManagement } from "@/components/dealer/AuctionManagement";
import { WatchlistManagement } from "@/components/dealer/WatchlistManagement";

interface DealerProfile {
  id: string;
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
      try {
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
          toast({
            title: "Error Loading Profile",
            description: "There was a problem loading your dealer profile. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (!dealerData) {
          console.error('No dealer profile found');
          toast({
            title: "Profile Not Found",
            description: "Your dealer profile could not be found. Please contact support.",
            variant: "destructive",
          });
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
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
        navigate('/auth');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VerificationBanner verificationStatus={dealerProfile.verification_status} />
        <DealerHeader dealerProfile={dealerProfile} />
        <div className="mt-8">
          <QuickActions />
        </div>
        <div className="mt-8">
          <WatchlistManagement />
        </div>
        <div className="mt-8">
          <AuctionManagement dealerId={dealerProfile.id} />
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
