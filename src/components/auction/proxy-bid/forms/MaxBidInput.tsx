
import { Input } from "@/components/ui/input";

interface MaxBidInputProps {
  value: string;
  onChange: (value: string) => void;
  currentHighestBid: number;
  minimumIncrement: number;
  disabled?: boolean;
}

export const MaxBidInput = ({
  value,
  onChange,
  currentHighestBid,
  minimumIncrement,
  disabled = false
}: MaxBidInputProps) => {
  return (
    <Input
      id="maxBid"
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={currentHighestBid + minimumIncrement}
      step={minimumIncrement}
      placeholder={`Enter amount greater than ${currentHighestBid}`}
      disabled={disabled}
      className="flex-1"
    />
  );
};
