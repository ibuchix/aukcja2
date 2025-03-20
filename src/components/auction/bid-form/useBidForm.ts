
import { useState, useEffect } from "react";
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
  const [bidAmount, setBidAmount] = useState<string>((currentHighestBid + minimumIncrement).toString());
  
  // Update bid amount when current highest bid or minimum increment changes
  useEffect(() => {
    setBidAmount((currentHighestBid + minimumIncrement).toString());
  }, [currentHighestBid, minimumIncrement]);
  
  const { isSubmitting, handlePlaceBid } = useBidFormActions({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement,
    onBidPlaced: (amount) => {
      // Update the bid amount input field to be the current + minimum increment
      setBidAmount((amount + minimumIncrement).toString());
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
