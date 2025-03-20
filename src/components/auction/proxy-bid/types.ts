
// Common types used across proxy bidding hooks and components

export interface ProxyBidData {
  max_bid_amount: number;
  last_processed_amount: number | null;
}

export interface UseProxyBidProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export interface UseProxyBidResult {
  maxBid: string;
  setMaxBid: (value: string) => void;
  existingProxyBid: number | null;
  isProxyBidUsed: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  optimalBid: number | null;
  useOptimalBid: () => void;
  handleSetMaxBid: () => Promise<void>;
  handleRemoveMaxBid: () => Promise<void>;
  isOnline: boolean;
}
