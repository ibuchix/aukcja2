
import { Input } from "@/components/ui/input";

interface BidInputProps {
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  currentHighestBid: number;
  minimumIncrement: number;
  isDisabled?: boolean;
}

export const BidInput = ({
  bidAmount,
  onBidAmountChange,
  currentHighestBid,
  minimumIncrement,
  isDisabled = false
}: BidInputProps) => {
  return (
    <Input
      type="number"
      value={bidAmount}
      onChange={(e) => onBidAmountChange(e.target.value)}
      placeholder="Enter bid amount"
      min={currentHighestBid + minimumIncrement}
      step={minimumIncrement}
      className="flex-1"
      disabled={isDisabled}
    />
  );
};
