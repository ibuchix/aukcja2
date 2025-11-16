
import { useState, useEffect } from "react";
import { useBidFormActions } from "./useBidFormActions";

interface UseBidFormProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  reservePrice?: number;
}

export const useBidForm = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  reservePrice,
}: UseBidFormProps) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidError, setBidError] = useState<string>("");
  
  // No automatic bid amount setting - let dealers enter their desired amount
  
  const { isSubmitting, handlePlaceBid } = useBidFormActions({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement,
    reservePrice,
    onBidPlaced: (amount) => {
      // Clear the bid amount after successful bid
      setBidAmount("");
    }
  });

  // Clear error when user types a new amount
  useEffect(() => {
    if (bidAmount && bidError) {
      setBidError("");
    }
  }, [bidAmount]);

  const handleBidSubmit = () => {
    const numericBidAmount = parseFloat(bidAmount);
    
    // Validate 40% minimum of reserve price
    if (reservePrice && numericBidAmount < (reservePrice * 0.4)) {
      const minAllowed = Math.ceil(reservePrice * 0.4);
      setBidError(`Minimalna oferta to ${minAllowed.toLocaleString('pl-PL')} PLN (40% ceny minimalnej)`);
      return;
    }
    setBidError("");
    handlePlaceBid(bidAmount);
  };

  return {
    bidAmount,
    setBidAmount,
    isSubmitting,
    handleBidSubmit,
    bidError
  };
};
