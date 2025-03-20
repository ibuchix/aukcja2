
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { 
  QueuedBid, 
  BidType, 
  getBidQueue, 
  addBidToQueue, 
  removeBidFromQueue, 
  updateBidInQueue 
} from "./index";
import { executeWithRetry } from "@/utils/retryUtils";

// Queue a standard bid to be processed when online
export const queueStandardBid = (
  carId: string,
  dealerId: string,
  amount: number
): QueuedBid => {
  const newBid: QueuedBid = {
    id: uuidv4(),
    carId,
    dealerId,
    amount,
    timestamp: Date.now(),
    type: 'standard',
    attempts: 0
  };
  
  addBidToQueue(newBid);
  return newBid;
};

// Queue a proxy bid to be processed when online
export const queueProxyBid = (
  carId: string,
  dealerId: string,
  amount: number,
  maxProxyAmount: number
): QueuedBid => {
  const newBid: QueuedBid = {
    id: uuidv4(),
    carId,
    dealerId,
    amount,
    maxProxyAmount,
    timestamp: Date.now(),
    type: 'proxy',
    attempts: 0
  };
  
  addBidToQueue(newBid);
  return newBid;
};

// Process a standard bid
const processStandardBid = async (bid: QueuedBid): Promise<boolean> => {
  try {
    // Update attempt information
    bid.attempts += 1;
    bid.lastAttempt = Date.now();
    updateBidInQueue(bid);

    // Call Supabase to place the bid
    const result = await executeWithRetry(() => 
      supabase.rpc('place_bid', {
        p_car_id: bid.carId,
        p_dealer_id: bid.dealerId,
        p_amount: bid.amount,
        p_is_proxy: false
      })
    );

    if (result && 'error' in result && result.error) {
      console.error(`Error processing standard bid ${bid.id}:`, result.error);
      return false;
    }

    if (result && 'data' in result && typeof result.data === 'object' && 
        result.data && 'success' in result.data && !result.data.success) {
      console.error(`Failed to process standard bid ${bid.id}:`, result.data);
      return false;
    }

    // If successful, remove from queue
    removeBidFromQueue(bid.id);
    return true;
  } catch (error) {
    console.error(`Error processing standard bid ${bid.id}:`, error);
    return false;
  }
};

// Process a proxy bid
const processProxyBid = async (bid: QueuedBid): Promise<boolean> => {
  try {
    // Update attempt information
    bid.attempts += 1;
    bid.lastAttempt = Date.now();
    updateBidInQueue(bid);

    if (!bid.maxProxyAmount) {
      console.error(`Proxy bid ${bid.id} is missing maxProxyAmount`);
      return false;
    }

    // Upsert the proxy bid
    const result = await executeWithRetry(() => 
      supabase
        .from('proxy_bids')
        .upsert({
          car_id: bid.carId,
          dealer_id: bid.dealerId,
          max_bid_amount: bid.maxProxyAmount,
        }, {
          onConflict: 'car_id,dealer_id'
        })
    );

    if (result && 'error' in result && result.error) {
      console.error(`Error upserting proxy bid ${bid.id}:`, result.error);
      return false;
    }

    // If successful, remove from queue
    removeBidFromQueue(bid.id);
    return true;
  } catch (error) {
    console.error(`Error processing proxy bid ${bid.id}:`, error);
    return false;
  }
};

// Process a single bid from the queue
export const processBid = async (bid: QueuedBid): Promise<boolean> => {
  if (bid.type === 'standard') {
    return processStandardBid(bid);
  } else {
    return processProxyBid(bid);
  }
};

// Get the number of bids in the queue
export const getQueuedBidsCount = (): number => {
  const queue = getBidQueue();
  return queue.bids.length;
};

// Get all queued bids
export const getQueuedBids = (): QueuedBid[] => {
  const queue = getBidQueue();
  return queue.bids;
};
