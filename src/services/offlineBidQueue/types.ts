
export type BidType = 'standard' | 'proxy';

export interface QueuedBid {
  id: string;
  carId: string;
  dealerId: string;
  amount: number;
  timestamp: number;
  type: BidType;
  maxProxyAmount?: number;
  attempts: number;
  lastAttempt?: number;
}

export interface BidQueueState {
  bids: QueuedBid[];
  lastSync: number | null;
}
