
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useBidFormActions } from "@/components/auction/bid-form/useBidFormActions";

interface MobileStickyBidBarProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  reservePrice: number;
  onDismiss: () => void;
}

const MobileStickyBidBar = ({
  carId,
  dealerId,
  currentHighestBid,
  reservePrice,
  onDismiss,
}: MobileStickyBidBarProps) => {
  const [bidAmount, setBidAmount] = useState("");

  const { isSubmitting, handlePlaceBid } = useBidFormActions({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement: 1,
    reservePrice,
    onBidPlaced: () => setBidAmount(""),
  });

  const formatPricePLN = (price: number) => {
    if (!price || price === 0) return "Brak rezerwy";
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const onSubmit = () => {
    if (bidAmount.trim()) {
      handlePlaceBid(bidAmount);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-[#454545] border-t border-gray-600 px-3 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2">
        {/* Reserve price context */}
        <div className="flex-shrink-0 min-w-0">
          <p className="text-[10px] text-gray-400 leading-tight">Rezerwa</p>
          <p className="text-xs font-semibold text-white truncate">
            {formatPricePLN(reservePrice)}
          </p>
        </div>

        {/* Bid input */}
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Kwota PLN"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          className="h-9 flex-1 min-w-0 text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
        />

        {/* Submit button */}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !bidAmount.trim()}
          className="h-9 px-4 flex-shrink-0 text-sm font-semibold text-white"
          style={{ backgroundColor: "#D81B24" }}
        >
          {isSubmitting ? "..." : "Licytuj"}
        </Button>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Zamknij pasek licytacji"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MobileStickyBidBar;
