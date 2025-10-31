
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBidMonitoring } from "@/components/dealer/bid-monitoring/useBidMonitoring";
import { BidMetricsCard } from "@/components/dealer/bid-monitoring/BidMetricsCard";
import { BidFilters } from "@/components/dealer/bid-monitoring/BidFilters";
import { BidActivityTimeline } from "@/components/dealer/bid-monitoring/BidActivityTimeline";
import { BidExposureCard } from "@/components/dealer/bid-monitoring/BidExposureCard";
import { ActivitySquare } from "lucide-react";
import { useRealtimeBidEvents } from "@/hooks/useRealtimeBidEvents";
import { BidActivity, BidMonitoringFilters } from "@/components/dealer/bid-monitoring/types";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";

export default function BidMonitoring() {
  const { dealerProfile } = useCurrentDealerProfile();
  const { 
    bidActivity: initialBidActivity, 
    metrics, 
    isLoading, 
    filters: initialFilters, 
    applyFilters: applyInitialFilters 
  } = useBidMonitoring();

  // Use our new realtime bid events hook
  const { 
    activities: realtimeActivities, 
    filters: realtimeFilters,
    updateFilters 
  } = useRealtimeBidEvents({ 
    initialFilters: initialFilters,
    maxEventsToStore: 100
  });

  // Combine initial activities with realtime activities
  const [combinedActivities, setCombinedActivities] = useState<BidActivity[]>([]);

  // Update combined activities whenever initialBidActivity or realtimeActivities change
  useEffect(() => {
    // Combine and deduplicate activities by id
    const activityMap = new Map<string, BidActivity>();
    
    // Add initial activities to the map
    initialBidActivity.forEach(activity => {
      activityMap.set(activity.id, activity);
    });
    
    // Add realtime activities, potentially overwriting older versions
    realtimeActivities.forEach(activity => {
      activityMap.set(activity.id, activity);
    });
    
    // Convert map back to array and sort by timestamp (newest first)
    const combined = Array.from(activityMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setCombinedActivities(combined);
  }, [initialBidActivity, realtimeActivities]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: BidMonitoringFilters) => {
    // Apply filters to both systems
    applyInitialFilters(newFilters);
    updateFilters(newFilters);
  };

  return (
    <DashboardLayout>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-heading-lg font-kanit font-bold flex items-center gap-2">
            <ActivitySquare className="h-6 w-6" />
            Bid Monitoring Dashboard
          </CardTitle>
          <CardDescription>
            Real-time monitoring of your bidding activity across all auctions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BidFilters filters={realtimeFilters} onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <BidMetricsCard metrics={metrics} isLoading={isLoading} />
        {dealerProfile && <BidExposureCard dealerId={dealerProfile.id} />}
      </div>
      
      <BidActivityTimeline activities={combinedActivities} isLoading={isLoading} />
    </DashboardLayout>
  );
}
