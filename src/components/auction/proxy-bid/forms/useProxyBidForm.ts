
import { useState } from "react";

interface UseProxyBidFormProps {
  optimalBid: number | null;
  onUseOptimalBid?: () => void;
}

export const useProxyBidForm = ({
  optimalBid,
  onUseOptimalBid
}: UseProxyBidFormProps) => {
  const [showOptimalTip, setShowOptimalTip] = useState(false);

  const handleOptimalBidClick = () => {
    const newTipState = !showOptimalTip;
    setShowOptimalTip(newTipState);
    
    // If we're showing the tip and there's an optimal bid callback, execute it
    if (newTipState && onUseOptimalBid) {
      onUseOptimalBid();
    }
  };

  return {
    showOptimalTip,
    handleOptimalBidClick
  };
};
