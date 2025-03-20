
import { formatCurrency } from "@/lib/utils";

interface OptimalBidTipProps {
  optimalBid: number;
  showTip: boolean;
}

export const OptimalBidTip = ({ optimalBid, showTip }: OptimalBidTipProps) => {
  if (!showTip || !optimalBid) return null;
  
  return (
    <div className="mt-2 text-sm p-2 bg-muted rounded-md">
      <p>
        <span className="font-medium">Recommended optimal bid:</span> {formatCurrency(optimalBid)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        This suggestion is based on the car's reserve price, market value of similar vehicles, and current bidding activity.
      </p>
    </div>
  );
};
