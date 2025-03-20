
import { BidQueueState, QueuedBid } from "./types";

const BID_QUEUE_STORAGE_KEY = 'auction-dealer-bid-queue';

// Initialize the queue state in localStorage if it doesn't exist
export const initializeBidQueue = (): void => {
  const existingQueue = localStorage.getItem(BID_QUEUE_STORAGE_KEY);
  if (!existingQueue) {
    const initialState: BidQueueState = {
      bids: [],
      lastSync: null
    };
    localStorage.setItem(BID_QUEUE_STORAGE_KEY, JSON.stringify(initialState));
  }
};

// Get the current bid queue from localStorage
export const getBidQueue = (): BidQueueState => {
  try {
    const queueData = localStorage.getItem(BID_QUEUE_STORAGE_KEY);
    if (!queueData) {
      initializeBidQueue();
      return { bids: [], lastSync: null };
    }
    return JSON.parse(queueData) as BidQueueState;
  } catch (error) {
    console.error('Error retrieving bid queue from localStorage:', error);
    return { bids: [], lastSync: null };
  }
};

// Save the bid queue to localStorage
export const saveBidQueue = (queueState: BidQueueState): void => {
  try {
    localStorage.setItem(BID_QUEUE_STORAGE_KEY, JSON.stringify(queueState));
  } catch (error) {
    console.error('Error saving bid queue to localStorage:', error);
  }
};

// Add a bid to the queue
export const addBidToQueue = (bid: QueuedBid): void => {
  const queue = getBidQueue();
  queue.bids.push(bid);
  saveBidQueue(queue);
};

// Remove a bid from the queue
export const removeBidFromQueue = (bidId: string): void => {
  const queue = getBidQueue();
  queue.bids = queue.bids.filter(bid => bid.id !== bidId);
  saveBidQueue(queue);
};

// Update a bid in the queue
export const updateBidInQueue = (updatedBid: QueuedBid): void => {
  const queue = getBidQueue();
  const index = queue.bids.findIndex(bid => bid.id === updatedBid.id);
  if (index !== -1) {
    queue.bids[index] = updatedBid;
    saveBidQueue(queue);
  }
};

// Clear the entire bid queue
export const clearBidQueue = (): void => {
  saveBidQueue({ bids: [], lastSync: Date.now() });
};

// Update the last sync timestamp
export const updateLastSync = (): void => {
  const queue = getBidQueue();
  queue.lastSync = Date.now();
  saveBidQueue(queue);
};
