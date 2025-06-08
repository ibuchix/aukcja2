
import { DollarSign, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProxyBidInfo } from "./ProxyBidInfo";
import { ProxyBidForm } from "./forms/ProxyBidForm";
import { ProxyBidExplanation } from "./ProxyBidExplanation";
import { ProxyBidHistory } from "./ProxyBidHistory";
import { useProxyBid } from "./useProxyBid";
import { BidRecommendations } from "../BidRecommendations";
import { TourButton } from "@/components/tour/TourButton";

interface ProxyBidManagerProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  reservePrice?: number;
  isVerified?: boolean;
}

export const ProxyBidManager = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  reservePrice,
  isVerified = true,
}: ProxyBidManagerProps) => {
  const {
    maxBid,
    setMaxBid,
    existingProxyBid,
    isProxyBidUsed,
    isLoading,
    isSubmitting,
    optimalBid,
    useOptimalBid,
    handleSetMaxBid,
    handleRemoveMaxBid
  } = useProxyBid({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement
  });

  // Early return if dealer is not verified
  if (!isVerified) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Proxy Bidding - Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Proxy bidding is only available to verified dealers. Please complete your dealer verification to access this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Proxy Bidding
            <div className="ml-auto">
              <TourButton size="sm" variant="ghost" className="h-7">
                <HelpCircle className="mr-1 h-4 w-4" />
                How it works
              </TourButton>
            </div>
          </CardTitle>
          <CardDescription>
            Set a maximum bid and our system will automatically bid for you up to that amount
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse">Loading...</div>
          ) : (
            <>
              <ProxyBidExplanation />
              <ProxyBidInfo 
                existingProxyBid={existingProxyBid} 
                isProxyBidUsed={isProxyBidUsed} 
              />
              <ProxyBidForm 
                maxBid={maxBid}
                onMaxBidChange={setMaxBid}
                onSetMaxBid={handleSetMaxBid}
                onRemoveMaxBid={handleRemoveMaxBid}
                onUseOptimalBid={useOptimalBid}
                existingProxyBid={existingProxyBid}
                isProxyBidUsed={isProxyBidUsed}
                isSubmitting={isSubmitting}
                currentHighestBid={currentHighestBid}
                minimumIncrement={minimumIncrement}
                optimalBid={optimalBid}
              />
            </>
          )}
        </CardContent>
      </Card>

      <BidRecommendations 
        carId={carId} 
        dealerId={dealerId} 
        reservePrice={reservePrice}
        onSelectRecommendation={(amount) => setMaxBid(amount.toString())} 
      />

      <ProxyBidHistory carId={carId} dealerId={dealerId} />
    </>
  );
};
