
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDealerBids } from "./bids/useDealerBids";
import { BidsTable } from "./bids/BidsTable";
import { BidsEmptyState } from "./bids/BidsEmptyState";

export const DealerBids = () => {
  const { dealerProfile } = useCurrentDealerProfile();
  const { myBids, isLoading, isRefreshing, handleRefresh } = useDealerBids(dealerProfile?.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              Moje oferty
            </CardTitle>
            <CardDescription>
              Auta z Twoimi aktywnymi ofertami
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
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
        ) : myBids && myBids.length > 0 ? (
          <BidsTable bids={myBids} />
        ) : (
          <BidsEmptyState />
        )}
      </CardContent>
    </Card>
  );
};
