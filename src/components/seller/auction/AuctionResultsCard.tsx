import { BarChart, Calendar, DollarSign, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuctionResults } from "./useAuctionResults";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export const AuctionResultsCard = ({ sellerId }: { sellerId: string }) => {
  const { data: results, isLoading } = useAuctionResults(sellerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          Auction Results
        </CardTitle>
        <CardDescription>
          View performance metrics for your completed auctions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {results?.map((result) => (
            <div
              key={result.id}
              className="mb-6 p-4 border rounded-lg space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{result.auction.title}</h3>
                  <div className="flex items-center gap-2 text-subtitle-text">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Duration: {Math.round(result.duration_minutes / 60)}h
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-success font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {result.final_price}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-subtitle-text" />
                  <span>{result.unique_bidders} Unique Bidders</span>
                </div>
                <div>
                  <span className="text-subtitle-text">Total Bids: </span>
                  {result.total_bids}
                </div>
              </div>

              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-subtitle-text">Reserve Price:</span>
                  <span>${result.reserve_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtitle-text">Starting Price:</span>
                  <span>${result.start_price}</span>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};