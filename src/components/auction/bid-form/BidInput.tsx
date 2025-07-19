
import { Input } from "@/components/ui/input";

interface BidInputProps {
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  currentHighestBid: number;
  minimumIncrement?: number; // Made optional
  isDisabled?: boolean;
}

export const BidInput = ({
  bidAmount,
  onBidAmountChange,
  currentHighestBid,
  minimumIncrement = 1, // Set to 1 PLN as absolute minimum
  isDisabled = false
}: BidInputProps) => {
  return (
    <Input
      type="number"
      value={bidAmount}
      onChange={(e) => onBidAmountChange(e.target.value)}
      placeholder="Enter any bid amount"
      min={1}
      step="1"
      className="flex-1"
      disabled={isDisabled}
    />
  );
};
