
import { useState } from "react";
import { useProxyBidData } from "./useProxyBidData";
import { useProxyBidActions } from "./useProxyBidActions";
import { UseProxyBidProps, UseProxyBidResult } from "./types";

export const useProxyBid = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: UseProxyBidProps): UseProxyBidResult => {
  const {
    existingProxyBid,
    setExistingProxyBid,
    isProxyBidUsed,
    isLoading,
    optimalBid,
    isOnline
  } = useProxyBidData({ carId, dealerId });

  const [maxBid, setMaxBid] = useState<string>(
    existingProxyBid ? existingProxyBid.toString() : 
    optimalBid ? optimalBid.toString() : 
    ""
  );

  // Update maxBid when existingProxyBid changes
  if (existingProxyBid && existingProxyBid.toString() !== maxBid && maxBid === "") {
    setMaxBid(existingProxyBid.toString());
  }
  
  // Update maxBid when optimalBid is set and no existingProxyBid
  if (!existingProxyBid && optimalBid && maxBid === "") {
    setMaxBid(optimalBid.toString());
  }

  const {
    isSubmitting,
    handleSetMaxBid: submitMaxBid,
    handleRemoveMaxBid: removeMaxBid
  } = useProxyBidActions({
    carId,
    dealerId,
    currentHighestBid,
    minimumIncrement,
    existingProxyBid,
    setExistingProxyBid,
    isOnline
  });

  const handleSetMaxBid = async () => {
    const numericMaxBid = parseFloat(maxBid);
    if (!isNaN(numericMaxBid)) {
      await submitMaxBid(numericMaxBid);
    }
  };

  const handleRemoveMaxBid = async () => {
    await removeMaxBid();
    setMaxBid("");
  };

  // Function to use the optimal bid suggestion
  const useOptimalBid = () => {
    if (optimalBid) {
      setMaxBid(optimalBid.toString());
    }
  };

  return {
    maxBid,
    setMaxBid,
    existingProxyBid,
    isProxyBidUsed,
    isLoading,
    isSubmitting,
    optimalBid,
    useOptimalBid,
    handleSetMaxBid,
    handleRemoveMaxBid,
    isOnline
  };
};
