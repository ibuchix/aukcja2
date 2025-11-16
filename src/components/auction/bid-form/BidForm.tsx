
import { BidInput } from "./BidInput";
import { BidFormButton } from "./BidFormButton";
import { useBidForm } from "./useBidForm";

interface BidFormProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  reservePrice?: number;
}

export const BidForm = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  reservePrice,
}: BidFormProps) => {
  const {
    bidAmount,
    setBidAmount,
    isSubmitting,
    handleBidSubmit,
    bidError
  } = useBidForm({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement,
    reservePrice
  });

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        {reservePrice && (
          <p className="text-xs text-muted-foreground mb-2">
            Minimalna oferta: {Math.ceil(reservePrice * 0.4).toLocaleString('pl-PL')} PLN (40% ceny orientacyjnej)
          </p>
        )}
        <BidInput 
          bidAmount={bidAmount}
          onBidAmountChange={setBidAmount}
          currentHighestBid={currentHighestBid}
          minimumIncrement={minimumIncrement}
          isDisabled={isSubmitting}
        />
        {bidError && (
          <p className="text-sm text-red-600 mt-1 font-medium">{bidError}</p>
        )}
      </div>
      <BidFormButton 
        onClick={handleBidSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
