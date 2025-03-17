
import { DollarSign, TrendingUp } from "lucide-react";

interface BidInfoProps {
  currentHighestBid: number;
  minimumIncrement: number;
}

export const BidInfo = ({ currentHighestBid, minimumIncrement }: BidInfoProps) => {
  return (
    <>
      <div className="flex items-center gap-2 text-subtitle-text">
        <DollarSign className="w-4 h-4" />
        <span>Current Highest Bid: ${currentHighestBid}</span>
      </div>
      
      <div className="flex items-center gap-2 text-subtitle-text">
        <TrendingUp className="w-4 h-4" />
        <span>Minimum Increment: ${minimumIncrement}</span>
      </div>
    </>
  );
};
