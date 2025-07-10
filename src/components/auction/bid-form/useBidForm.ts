
import { useState } from "react";
import { useBidFormActions } from "./useBidFormActions";

interface UseBidFormProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const useBidForm = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: UseBidFormProps) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  
  // No automatic bid amount setting - let dealers enter their desired amount
  
  const { isSubmitting, handlePlaceBid } = useBidFormActions({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement,
    onBidPlaced: (amount) => {
      // Clear the bid amount after successful bid
      setBidAmount("");
    }
  });

  const handleBidSubmit = () => {
    handlePlaceBid(bidAmount);
  };

  return {
    bidAmount,
    setBidAmount,
    isSubmitting,
    handleBidSubmit
  };
};
