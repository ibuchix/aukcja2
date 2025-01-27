import { Megaphone, Plus, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuctionPromotions } from "./useAuctionPromotions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const AuctionPromotionsCard = ({ sellerId }: { sellerId: string }) => {
  const { data: promotions, isLoading } = useAuctionPromotions(sellerId);

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
        <div className="flex justify-between items-center">
          <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Auction Promotions
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Promotion
          </Button>
        </div>
        <CardDescription>
          Create and manage promotional campaigns for your auctions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {promotions?.map((promotion) => (
            <div
              key={promotion.id}
              className="mb-6 p-4 border rounded-lg space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{promotion.auction.title}</h3>
                  <div className="flex items-center gap-2 text-subtitle-text">
                    <Target className="h-4 w-4" />
                    <span>{promotion.promotion_type}</span>
                  </div>
                </div>
                <Badge
                  variant={promotion.status === "active" ? "success" : "secondary"}
                >
                  {promotion.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-subtitle-text">Budget: </span>
                  ${promotion.budget}
                </div>
                <div>
                  <span className="text-subtitle-text">Views: </span>
                  {promotion.performance_metrics?.views || 0}
                </div>
                <div>
                  <span className="text-subtitle-text">Clicks: </span>
                  {promotion.performance_metrics?.clicks || 0}
                </div>
                <div>
                  <span className="text-subtitle-text">Engagement: </span>
                  {promotion.performance_metrics?.engagement_rate || 0}%
                </div>
              </div>

              <div className="text-sm space-y-1">
                <div className="text-subtitle-text">Target Audience:</div>
                <div className="flex flex-wrap gap-2">
                  {promotion.target_audience?.location?.map((location) => (
                    <Badge key={location} variant="outline">
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};