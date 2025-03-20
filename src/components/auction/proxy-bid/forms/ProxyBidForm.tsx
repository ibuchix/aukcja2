
import { MaxBidInput } from "./MaxBidInput";
import { OptimalBidButton } from "./OptimalBidButton";
import { OptimalBidTip } from "./OptimalBidTip";
import { ProxyBidButtons } from "./ProxyBidButtons";
import { ProxyBidStatus } from "./ProxyBidStatus";
import { useProxyBidForm } from "./useProxyBidForm";

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
  const {
    showOptimalTip,
    handleOptimalBidClick
  } = useProxyBidForm({
    optimalBid: optimalBid || null,
    onUseOptimalBid
  });

  return (
    <div className="mt-4">
      <div className="mb-2">
        <label htmlFor="maxBid" className="block text-sm font-medium mb-1">
          Your Maximum Bid Amount
        </label>
        <div className="flex gap-2">
          <MaxBidInput
            value={maxBid}
            onChange={onMaxBidChange}
            currentHighestBid={currentHighestBid}
            minimumIncrement={minimumIncrement}
            disabled={isSubmitting}
          />
          
          {optimalBid && !existingProxyBid && (
            <OptimalBidButton
              onClick={handleOptimalBidClick}
              isActive={showOptimalTip}
            />
          )}
        </div>
        
        {optimalBid && (
          <OptimalBidTip
            optimalBid={optimalBid}
            showTip={showOptimalTip}
          />
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <ProxyBidButtons
          existingProxyBid={existingProxyBid}
          isSubmitting={isSubmitting}
          maxBid={maxBid}
          onSetMaxBid={onSetMaxBid}
          onRemoveMaxBid={onRemoveMaxBid}
          currentHighestBid={currentHighestBid}
        />
      </div>

      <ProxyBidStatus
        existingProxyBid={existingProxyBid}
        isProxyBidUsed={isProxyBidUsed}
      />
    </div>
  );
};
