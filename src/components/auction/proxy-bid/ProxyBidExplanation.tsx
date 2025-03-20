
import { Info } from "lucide-react";

export const ProxyBidExplanation = () => {
  return (
    <div className="mb-4 p-3 bg-muted rounded-md flex items-start gap-3">
      <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="text-sm text-muted-foreground">
        Proxy bidding will automatically place bids on your behalf up to your maximum amount, 
        only bidding enough to outbid other bidders by the minimum increment.
      </div>
    </div>
  );
};
