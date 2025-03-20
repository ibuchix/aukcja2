
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProxyBidFormProps {
  maxBid: string;
  onMaxBidChange: (value: string) => void;
  onSetMaxBid: () => void;
  onRemoveMaxBid: () => void;
  onUseOptimalBid?: () => void;
  existingProxyBid: number | null;
  isProxyBidUsed: boolean;
  isSubmitting: boolean;
  currentHighestBid: number;
  minimumIncrement: number;
  optimalBid?: number | null;
}

export const ProxyBidForm = ({
  maxBid,
  onMaxBidChange,
  onSetMaxBid,
  onRemoveMaxBid,
  onUseOptimalBid,
  existingProxyBid,
  isProxyBidUsed,
  isSubmitting,
  currentHighestBid,
  minimumIncrement,
  optimalBid
}: ProxyBidFormProps) => {
  const [showOptimalTip, setShowOptimalTip] = useState(false);

  const handleMaxBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaxBidChange(e.target.value);
  };

  return (
    <div className="mt-4">
      <div className="mb-2">
        <label htmlFor="maxBid" className="block text-sm font-medium mb-1">
          Your Maximum Bid Amount
        </label>
        <div className="flex gap-2">
          <Input
            id="maxBid"
            type="number"
            value={maxBid}
            onChange={handleMaxBidChange}
            min={currentHighestBid + minimumIncrement}
            step={minimumIncrement}
            placeholder={`Enter amount greater than ${currentHighestBid}`}
            disabled={isSubmitting}
            className="flex-1"
          />
          
          {optimalBid && !existingProxyBid && (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => {
                setShowOptimalTip(!showOptimalTip);
                if (onUseOptimalBid && !showOptimalTip) {
                  onUseOptimalBid();
                }
              }}
              className="flex-shrink-0"
              title="Use AI-recommended optimal bid"
            >
              <Lightbulb className={`h-4 w-4 ${showOptimalTip ? 'text-yellow-500' : ''}`} />
            </Button>
          )}
        </div>
        
        {showOptimalTip && optimalBid && (
          <div className="mt-2 text-sm p-2 bg-muted rounded-md">
            <p>
              <span className="font-medium">Recommended optimal bid:</span> {formatCurrency(optimalBid)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This suggestion is based on the car's reserve price, market value of similar vehicles, and current bidding activity.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {existingProxyBid ? (
          <>
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
          </>
        ) : (
          <Button
            variant="default"
            onClick={onSetMaxBid}
            disabled={isSubmitting || !maxBid || parseFloat(maxBid) <= currentHighestBid}
            className="w-full"
          >
            {isSubmitting ? "Processing..." : "Set Maximum Bid"}
          </Button>
        )}
      </div>

      {existingProxyBid && (
        <div className="mt-3 text-sm">
          <p>
            Current maximum bid: <span className="font-semibold">{formatCurrency(existingProxyBid)}</span>
          </p>
          {isProxyBidUsed && (
            <p className="text-xs text-muted-foreground mt-1">
              Your proxy bid is currently being used to automatically place bids on your behalf.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
