
import { Car, Clock, Activity, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StatsSectionProps {
  recentActivity: boolean;
}

export const StatsSection = ({ recentActivity }: StatsSectionProps) => {
  return (
    <div className="mb-10 bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Activity className="w-5 h-5 text-iris mr-2" />
        Dashboard Summary
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Active Auctions */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-blue-50 p-2 rounded-full mr-3">
              <Car className="w-5 h-5 text-iris" />
            </div>
            <h3 className="font-medium">Active Auctions</h3>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-dark">0</span>
            <span className="text-subtitle-text text-sm">Auctions you're participating in</span>
          </div>
        </div>
        
        {/* Watchlist */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-amber-50 p-2 rounded-full mr-3">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-medium">Watchlist</h3>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-dark">0</span>
            <span className="text-subtitle-text text-sm">Vehicles you're watching</span>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-green-50 p-2 rounded-full mr-3">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-medium">Recent Activity</h3>
          </div>
          {!recentActivity ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <Alert className="bg-gray-50 border-gray-100">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm text-muted-foreground">
                No recent activity to show. Start by browsing available auctions.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};
