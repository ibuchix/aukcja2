import { useAuth } from "@supabase/auth-helpers-react";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";
import { AuctionManagement } from "@/components/dealer/AuctionManagement";
import { AuctionAnalytics } from "@/components/dealer/AuctionAnalytics";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";

export const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <VerificationBanner />
      <DealerHeader />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuctionAnalytics dealerId={user.id} />
        <AuctionManagement dealerId={user.id} />
      </div>
    </div>
  );
};