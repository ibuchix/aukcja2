
import { BidInput } from "./BidInput";
import { BidFormButton } from "./BidFormButton";
import { useBidForm } from "./useBidForm";

interface BidFormProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const BidForm = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: BidFormProps) => {
  const {
    bidAmount,
    setBidAmount,
    isSubmitting,
    handleBidSubmit
  } = useBidForm({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement
  });

  return (
    <div className="flex gap-2">
      <BidInput 
        bidAmount={bidAmount}
        onBidAmountChange={setBidAmount}
        currentHighestBid={currentHighestBid}
        minimumIncrement={minimumIncrement}
        isDisabled={isSubmitting}
      />
      <BidFormButton 
        onClick={handleBidSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
