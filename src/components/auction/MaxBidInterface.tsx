
import { BidNotificationHandler } from "./BidNotificationHandler";
import { BidHistory } from "./BidHistory";
import { ProxyBidManager } from "./ProxyBidManager";

interface MaxBidInterfaceProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  auctionEndTime: string;
  reservePrice?: number;
}

export const MaxBidInterface = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  auctionEndTime,
  reservePrice,
}: MaxBidInterfaceProps) => {
  return (
    <div className="space-y-4">
      <BidNotificationHandler 
        carId={carId}
        dealerId={dealerId}
        currentBid={currentHighestBid}
      />
      
      <ProxyBidManager
        carId={carId}
        dealerId={dealerId}
        currentHighestBid={currentHighestBid}
        minimumIncrement={minimumIncrement}
        reservePrice={reservePrice}
      />
      
      <BidHistory carId={carId} />
    </div>
  );
};
