
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, DollarSign, AlertTriangle, Wallet } from "lucide-react";
import { useDealerBidExposure } from "@/hooks/useBidCalculations";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface BidExposureCardProps {
  dealerId: string;
}

export const BidExposureCard = ({ dealerId }: BidExposureCardProps) => {
  const { data: exposure, isLoading } = useDealerBidExposure(dealerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Bid Exposure
          </CardTitle>
          <CardDescription>
            Your current bidding exposure and potential spend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exposure) return null;

  // Calculate risk level based on potential exposure vs winning exposure
  const exposureRatio = exposure.maximum_potential_exposure / (exposure.winning_bids_exposure || 1);
  const riskLevel = 
    exposureRatio > 5 ? "High" : 
    exposureRatio > 2 ? "Moderate" : 
    "Low";
  
  const riskColor = 
    riskLevel === "High" ? "text-red-500" : 
    riskLevel === "Moderate" ? "text-yellow-500" : 
    "text-green-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Bid Exposure
        </CardTitle>
        <CardDescription>
          Your current bidding exposure and potential spend
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-muted-foreground text-sm mb-1 flex items-center">
              <Wallet className="h-4 w-4 mr-1" />
              Active Bids
            </div>
            <div className="text-xl font-bold">{exposure.active_bids_count}</div>
            <div className="text-xs mt-1 flex gap-1">
              <span className="text-green-500">{exposure.winning_bids_count} Winning</span>
              <span>•</span>
              <span className="text-yellow-500">{exposure.outbid_bids_count} Outbid</span>
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground text-sm mb-1 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Proxy Bids
            </div>
            <div className="text-xl font-bold">{exposure.proxy_bids_count}</div>
            <div className="text-xs mt-1">
              Maximum exposure: {formatCurrency(exposure.proxy_bids_exposure)}
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mt-6">
          <div className="flex justify-between items-center">
            <span className="text-sm">Current Winning Bids Value</span>
            <span className="font-semibold">{formatCurrency(exposure.winning_bids_exposure)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Maximum Potential Exposure</span>
            <span className="font-semibold">{formatCurrency(exposure.maximum_potential_exposure)}</span>
          </div>
          
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <span className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Overall Exposure Risk
            </span>
            <span className={`font-bold ${riskColor}`}>{riskLevel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
