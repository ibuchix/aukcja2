
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, ArrowDown, ArrowUp, TrendingUp, DollarSign } from "lucide-react";
import { BidMetrics } from "./types";

interface BidMetricsCardProps {
  metrics: BidMetrics;
  isLoading: boolean;
}

export const BidMetricsCard = ({ metrics, isLoading }: BidMetricsCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bidding Metrics</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-kanit font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bidding Metrics
        </CardTitle>
        <CardDescription>
          Overview of your bidding activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Dices className="h-4 w-4 mr-1" />
              Active Bids
            </div>
            <div className="text-2xl font-bold text-primary">
              {metrics.activeBidsCount}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <ArrowDown className="h-4 w-4 mr-1" />
              Outbid
            </div>
            <div className="text-2xl font-bold text-amber-500">
              {metrics.outbidCount}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <ArrowUp className="h-4 w-4 mr-1" />
              Won Auctions
            </div>
            <div className="text-2xl font-bold text-green-500">
              {metrics.wonCount}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <ArrowDown className="h-4 w-4 mr-1" />
              Lost Auctions
            </div>
            <div className="text-2xl font-bold text-destructive">
              {metrics.lostCount}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-1" />
              Total Invested
            </div>
            <div className="text-2xl font-bold">
              ${metrics.totalInvested.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-1" />
              Potential Exposure
            </div>
            <div className="text-2xl font-bold">
              ${metrics.potentialExposure.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
