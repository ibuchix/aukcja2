
import { DealerBids } from "@/components/dealer/DealerBids";
import { AuctionManagement } from "@/components/dealer/AuctionManagement";
import { WatchlistManagement } from "@/components/dealer/WatchlistManagement";

interface MainDashboardProps {
  profile: any;
  isLoading: boolean;
  error: string | null;
}

export const MainDashboard = ({ profile, isLoading, error }: MainDashboardProps) => {
  if (isLoading) {
    return <div className="text-center py-4">Loading dashboard data...</div>;
  }

  if (error || !profile) {
    return <div className="text-center py-4 text-red-500">Error loading dashboard: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <DealerBids />
      {profile?.id && (
        <>
          <AuctionManagement dealerId={profile.id} />
          <WatchlistManagement dealerId={profile.id} />
        </>
      )}
    </div>
  );
};
