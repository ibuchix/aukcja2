
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
    let mounted = true;

    const checkAuthAndProfile = async () => {
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error details:', sessionError);
          throw new Error('Failed to get session');
        }

        if (!session || !session.user) {
          console.log('No active session found');
          navigate('/auth');
          return;
        }

        console.log('Fetching dealer profile for user:', session.user.id);

        // Fetch dealer profile
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealers')
          .select('id, dealership_name, license_number, address, verification_status')
          .eq('user_id', session.user.id)
          .single();

        if (dealerError) {
          console.error('Dealer profile fetch error:', dealerError);
          throw new Error(dealerError.message);
        }

        if (!dealerData) {
          console.error('No dealer profile found for user:', session.user.id);
          throw new Error('Dealer profile not found');
        }

        if (mounted) {
          console.log('Successfully loaded dealer profile:', dealerData.id);
          setDealerProfile(dealerData);
          setLoading(false);

          if (dealerData.verification_status === 'pending') {
            toast({
              title: "Account Pending Verification",
              description: "Your account is currently under review. You'll be notified once verified.",
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error('Profile loading error:', error);
        
        if (mounted) {
          setLoading(false);
          toast({
            title: "Error Loading Profile",
            description: error instanceof Error ? error.message : "Failed to load dealer profile",
            variant: "destructive",
          });
          navigate('/auth');
        }
      }
    };

    checkAuthAndProfile();

    return () => {
      mounted = false;
    };
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!dealerProfile) {
    return null;
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
