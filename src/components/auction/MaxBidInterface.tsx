
import { BidNotificationHandler } from "./BidNotificationHandler";
import { ProxyBidManager } from "./ProxyBidManager";

interface MaxBidInterfaceProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  auctionEndTime: string;
  reservePrice?: number;
  isVerified?: boolean;
}

export const MaxBidInterface = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  auctionEndTime,
  reservePrice,
  isVerified = true,
}: MaxBidInterfaceProps) => {
  // Early return if dealer is not verified
  if (!isVerified) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">
          Bidding functionality is only available to verified dealers.
        </p>
      </div>
    );
  }

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
        isVerified={isVerified}
      />
    </div>
  );
};
