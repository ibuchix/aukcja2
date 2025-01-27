import { useSession } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { QuickActions } from "@/components/dealer/QuickActions";
import { AuctionAnalytics } from "@/components/dealer/AuctionAnalytics";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";

interface DealerData {
  dealership_name: string;
  address: string | null;
  license_number: string;
  verification_status: string;
}

const Dashboard = () => {
  const session = useSession();

  const { data: dealerData, isLoading } = useQuery({
    queryKey: ["dealer-profile", session?.user?.id] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealers")
        .select("dealership_name, address, license_number, verification_status")
        .eq("user_id", session?.user?.id)
        .single();

      if (error) throw error;
      return data as DealerData;
    },
    enabled: !!session?.user?.id,
  });

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <VerificationBanner verificationStatus={dealerData?.verification_status || 'pending'} />
      <DealerHeader dealerProfile={dealerData!} />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuctionAnalytics dealerId={session.user.id} />
      </div>
    </div>
  );
};

export default Dashboard;