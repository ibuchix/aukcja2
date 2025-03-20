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
}

export const ProxyBidManager = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
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
        onSelectRecommendation={(amount) => setMaxBid(amount.toString())} 
      />

      <ProxyBidHistory carId={carId} dealerId={dealerId} />
    </>
  );
};
