
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
  // New auction schedule props
  scheduleStatus?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  auctionTimingStatus?: 'scheduled' | 'running' | 'ended' | 'unknown';
}

export const MaxBidInterface = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  auctionEndTime,
  reservePrice,
  isVerified = true,
  scheduleStatus,
  scheduleStartTime,
  scheduleEndTime,
  auctionTimingStatus,
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

  // Check auction timing status
  if (auctionTimingStatus !== 'running') {
    let message = '';
    let bgColor = 'bg-blue-50';
    let textColor = 'text-blue-800';
    let borderColor = 'border-blue-200';

    if (auctionTimingStatus === 'scheduled') {
      message = `Auction has not started yet. ${scheduleStartTime ? `Starts at: ${new Date(scheduleStartTime).toLocaleString()}` : 'Start time to be announced.'}`;
    } else if (auctionTimingStatus === 'ended') {
      message = `Auction has ended. ${scheduleEndTime ? `Ended at: ${new Date(scheduleEndTime).toLocaleString()}` : ''}`;
      bgColor = 'bg-gray-50';
      textColor = 'text-gray-800';
      borderColor = 'border-gray-200';
    } else {
      message = 'This car is not currently scheduled for auction.';
    }

    return (
      <div className={`p-4 ${bgColor} border ${borderColor} rounded-lg`}>
        <h3 className={`font-semibold ${textColor} mb-2`}>Auction Not Active</h3>
        <p className={textColor}>
          {message}
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
