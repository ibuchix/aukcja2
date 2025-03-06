
import { Car, Clock, Activity } from "lucide-react";
import { StatisticsCard } from "./StatisticsCard";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsSectionProps {
  recentActivity: boolean;
}

export const StatsSection = ({ recentActivity }: StatsSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatisticsCard 
        title="Active Auctions" 
        value="0" 
        description="Auctions you're participating in" 
        icon={Car} 
      />
      <StatisticsCard 
        title="Watchlist" 
        value="0" 
        description="Vehicles you're watching" 
        icon={Clock} 
      />
      <StatisticsCard 
        title="Recent Activity" 
        value="" 
        description={recentActivity ? "No recent activity to show" : ""} 
        icon={Activity} 
        isLoading={!recentActivity}
      />
    </div>
  );
};
