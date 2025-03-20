
import { formatCurrency } from "@/lib/utils";

interface ProxyBidStatusProps {
  existingProxyBid: number | null;
  isProxyBidUsed: boolean;
}

export const ProxyBidStatus = ({ existingProxyBid, isProxyBidUsed }: ProxyBidStatusProps) => {
  if (!existingProxyBid) return null;
  
  return (
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
  );
};
