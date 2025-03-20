
import { Button } from "@/components/ui/button";

interface ProxyBidButtonsProps {
  existingProxyBid: number | null;
  isSubmitting: boolean;
  maxBid: string;
  onSetMaxBid: () => void;
  onRemoveMaxBid: () => void;
  currentHighestBid: number;
}

export const ProxyBidButtons = ({
  existingProxyBid,
  isSubmitting,
  maxBid,
  onSetMaxBid,
  onRemoveMaxBid,
  currentHighestBid
}: ProxyBidButtonsProps) => {
  if (existingProxyBid) {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          onClick={onSetMaxBid}
          disabled={isSubmitting || !maxBid || parseFloat(maxBid) === existingProxyBid}
          className="flex-1"
        >
          {isSubmitting ? "Processing..." : "Update Maximum Bid"}
        </Button>
        <Button
          variant="outline"
          onClick={onRemoveMaxBid}
          disabled={isSubmitting}
        >
          Remove
        </Button>
      </div>
    );
  }
  
  return (
    <Button
      variant="default"
      onClick={onSetMaxBid}
      disabled={isSubmitting || !maxBid || parseFloat(maxBid) <= currentHighestBid}
      className="w-full"
    >
      {isSubmitting ? "Processing..." : "Set Maximum Bid"}
    </Button>
  );
};
