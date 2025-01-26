import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BidNotificationHandler } from "./BidNotificationHandler";
import { AuctionTimer } from "./AuctionTimer";
import { BidInfo } from "./BidInfo";
import { BidForm } from "./BidForm";

interface MaxBidInterfaceProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  auctionEndTime: string;
}

export const MaxBidInterface = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  auctionEndTime,
}: MaxBidInterfaceProps) => {
  return (
    <>
      <BidNotificationHandler 
        carId={carId}
        dealerId={dealerId}
        currentBid={currentHighestBid}
      />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald">Place Maximum Bid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuctionTimer auctionEndTime={auctionEndTime} />
          <BidInfo 
            currentHighestBid={currentHighestBid}
            minimumIncrement={minimumIncrement}
          />
          <BidForm
            carId={carId}
            dealerId={dealerId}
            currentHighestBid={currentHighestBid}
            minimumIncrement={minimumIncrement}
          />
        </CardContent>
      </Card>
    </>
  );
};