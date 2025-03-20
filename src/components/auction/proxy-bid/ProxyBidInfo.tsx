
import { AlertTriangle } from "lucide-react";

interface ProxyBidInfoProps {
  existingProxyBid: number | null;
  isProxyBidUsed: boolean;
}

export const ProxyBidInfo = ({ existingProxyBid, isProxyBidUsed }: ProxyBidInfoProps) => {
  if (!existingProxyBid) return null;
  
  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-amber-800">
        You currently have a maximum bid of <strong>${existingProxyBid.toLocaleString()}</strong> set for this auction.
        {isProxyBidUsed ? (
          <span className="block mt-1">
            This proxy bid has been used to place automatic bids and cannot be removed.
            You can still increase your maximum bid amount.
          </span>
        ) : (
          <span className="block mt-1">
            Setting a new value will replace your current maximum bid.
          </span>
        )}
      </div>
    </div>
  );
};
