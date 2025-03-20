
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBidMonitoring } from "@/components/dealer/bid-monitoring/useBidMonitoring";
import { BidMetricsCard } from "@/components/dealer/bid-monitoring/BidMetricsCard";
import { BidFilters } from "@/components/dealer/bid-monitoring/BidFilters";
import { BidActivityTimeline } from "@/components/dealer/bid-monitoring/BidActivityTimeline";
import { ActivitySquare } from "lucide-react";

export default function BidMonitoring() {
  const { 
    bidActivity, 
    metrics, 
    isLoading, 
    filters, 
    applyFilters 
  } = useBidMonitoring();

  return (
    <DashboardLayout>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-heading-lg font-oswald flex items-center gap-2">
            <ActivitySquare className="h-6 w-6" />
            Bid Monitoring Dashboard
          </CardTitle>
          <CardDescription>
            Real-time monitoring of your bidding activity across all auctions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BidFilters filters={filters} onFiltersChange={applyFilters} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <BidMetricsCard metrics={metrics} isLoading={isLoading} />
        
        <BidActivityTimeline activities={bidActivity} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
