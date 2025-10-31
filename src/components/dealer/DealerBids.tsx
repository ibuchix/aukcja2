
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDealerBids } from "./bids/useDealerBids";
import { BidsTable } from "./bids/BidsTable";
import { BidsEmptyState } from "./bids/BidsEmptyState";
import { MyBid } from "./bids/types";

// Filter bids to show only recent ones (within 2 days)
const filterRecentBids = (bids: MyBid[]): MyBid[] => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  return bids.filter(bid => {
    // Always show running/active auctions regardless of age
    if (bid.auctionTimingStatus === 'active') {
      return true;
    }
    
    // For scheduled auctions, show only if bid was created within last 2 days
    if (bid.auctionTimingStatus === 'scheduled') {
      const bidCreatedAt = new Date(bid.created_at);
      return bidCreatedAt >= twoDaysAgo;
    }
    
    // For ended auctions, show only if auction ended within last 2 days
    if (bid.auctionTimingStatus === 'ended') {
      const auctionEndTime = new Date(bid.car.auction_end_time);
      return auctionEndTime >= twoDaysAgo;
    }
    
    // Show unknown status within 2 days (fallback based on bid creation)
    const bidCreatedAt = new Date(bid.created_at);
    return bidCreatedAt >= twoDaysAgo;
  });
};

export const DealerBids = () => {
  const { dealerProfile } = useCurrentDealerProfile();
  const { myBids, isLoading, isRefreshing, handleRefresh } = useDealerBids(dealerProfile?.id);
  
  // Filter bids to show only recent ones
  const filteredBids = myBids ? filterRecentBids(myBids) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-heading-md font-kanit font-semibold flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              Moje oferty
            </CardTitle>
            <CardDescription>
              Auta z Twoimi aktywnymi ofertami. Po zakończeniu aukcji statusy się zaktualizują, a wygrane auta znajdziesz w sekcji „Wygrane auta".
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Odswiez
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredBids && filteredBids.length > 0 ? (
          <BidsTable bids={filteredBids} />
        ) : (
          <BidsEmptyState />
        )}
      </CardContent>
    </Card>
  );
};
