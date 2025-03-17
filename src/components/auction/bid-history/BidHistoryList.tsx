
import { Separator } from "@/components/ui/separator";
import { BidItem } from "./BidItem";
import { Bid } from "./types";

interface BidHistoryListProps {
  bids: Bid[];
}

export const BidHistoryList = ({ bids }: BidHistoryListProps) => {
  if (bids.length === 0) {
    return <div className="text-center py-4">No bids yet</div>;
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
      {bids.map((bid) => (
        <BidItem key={bid.id} bid={bid} />
      ))}
    </div>
  );
};
