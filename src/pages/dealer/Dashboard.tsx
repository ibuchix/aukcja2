import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";
import { AuctionManagement } from "@/components/dealer/AuctionManagement";
import { WatchlistManagement } from "@/components/dealer/WatchlistManagement";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
  const { profile, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadDealerProfile = async () => {
      try {
        if (!user) return;
        
        setLoading(true);
        
        // Use profile from auth context if available
        if (profile) {
          setDealerProfile({
            id: profile.id,
            dealership_name: profile.dealership_name,
            license_number: profile.license_number,
            address: profile.address,
            verification_status: profile.verification_status
          });
          setLoading(false);
          return;
        }
        
        // Otherwise fetch dealer profile
        console.log('Attempting to fetch dealer profile with user_id:', user.id);
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealers')
          .select('id, dealership_name, license_number, address, verification_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dealerError) {
          console.error('Dealer profile fetch error:', dealerError);
          throw new Error(dealerError.message);
        }

        if (!dealerData) {
          console.error('No dealer profile found for user:', user.id);
          throw new Error('No dealer profile found. Please complete registration.');
        }

        if (mounted) {
          console.log('Successfully loaded dealer profile:', dealerData);
          setDealerProfile(dealerData);

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
          toast({
            title: "Error Loading Profile",
            description: error instanceof Error ? error.message : "Failed to load dealer profile",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDealerProfile();

    return () => {
      mounted = false;
    };
  }, [user, profile, toast]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        {loading ? (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
          </div>
        ) : dealerProfile ? (
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
        ) : null}
      </div>
    </ProtectedRoute>
  );
};

export default DealerDashboard;
