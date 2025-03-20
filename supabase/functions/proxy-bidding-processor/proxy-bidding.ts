
import { createServiceClient } from '../_shared/supabase-client.ts';
import { executeWithRetry } from '../_shared/retry-utils.ts';
import { ProxyBid } from './types.ts';
import { calculateNextBidAmount } from './bid-calculator.ts';
import { placeBid } from './bid-placement.ts';

/**
 * Process the proxy bidding logic for an auction
 */
export async function processProxyBidding(
  carId: string,
  proxyBids: ProxyBid[],
  currentBid: number,
  price: number,
  bidIncrement: number,
  checkpoint: (stage: string, details?: Record<string, any>) => Promise<any>,
  transactionId: string
) {
  const supabase = createServiceClient();
  
  // Get the top two proxy bids
  const topBid = proxyBids[0];
  const secondBid = proxyBids[1];
  
  await checkpoint('fetch_current_high_bid');
  
  // Check if the current high bidder is already the top proxy bidder
  const { data: currentHighBid, error: highBidError } = await executeWithRetry(async () => {
    return await supabase
      .from('bids')
      .select('dealer_id, amount')
      .eq('car_id', carId)
      .eq('status', 'active')
      .single();
  }, {
    maxRetries: 5,
    baseDelay: 500,
    jitter: true,
    module: 'auction-processor',
    operationName: 'fetch_current_high_bid',
    context: { carId, transactionId },
    onRetry: (attempt, delay, error) => {
      console.log(`Retrying fetch_current_high_bid (attempt ${attempt}) in ${delay}ms due to: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  if (highBidError && highBidError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
    console.error(`Error fetching current high bid for auction ${carId}:`, highBidError.message);
    await checkpoint('error', { error: highBidError.message, stage: 'fetch_current_high_bid' });
    return { carId, processed: false, reason: `Error fetching high bid: ${highBidError.message}` };
  }
  
  // If the top proxy bidder is already winning, we don't need to do anything
  if (currentHighBid && currentHighBid.dealer_id === topBid.dealer_id) {
    console.log(`Top proxy bidder ${topBid.dealer_id} is already winning auction ${carId}`);
    await checkpoint('skipped', { reason: 'Top proxy bidder already winning' });
    return { carId, processed: false, reason: 'Top proxy bidder already winning' };
  }
  
  await checkpoint('calculate_next_bid');
  
  // Calculate the next bid amount
  const nextBidAmount = calculateNextBidAmount(
    currentBid, 
    price, 
    bidIncrement, 
    topBid.max_bid_amount, 
    secondBid.max_bid_amount
  );
  
  console.log(`Calculated next bid for auction ${carId}: ${nextBidAmount} (top max: ${topBid.max_bid_amount}, second max: ${secondBid.max_bid_amount}, min increment: ${bidIncrement})`);
  await checkpoint('bid_calculated', { 
    nextBidAmount, 
    topBidderMax: topBid.max_bid_amount, 
    secondBidderMax: secondBid.max_bid_amount,
    minBid: Math.max(price, (currentBid || 0) + bidIncrement),
    bidIncrement
  });
  
  // If calculated bid is higher than top bidder's max, something went wrong
  if (nextBidAmount > topBid.max_bid_amount) {
    console.error(`Calculated bid ${nextBidAmount} exceeds top bidder's max ${topBid.max_bid_amount}`);
    await checkpoint('error', { 
      error: 'Bid calculation error',
      nextBidAmount,
      topBidderMax: topBid.max_bid_amount
    });
    return { carId, processed: false, reason: 'Calculated bid exceeds top bidder maximum' };
  }
  
  // Begin trying to place the bid
  await checkpoint('place_bid_attempt', { amount: nextBidAmount, dealer_id: topBid.dealer_id });
  
  return await placeBid(
    carId, 
    topBid.dealer_id, 
    nextBidAmount, 
    topBid.max_bid_amount, 
    currentBid, 
    currentHighBid?.dealer_id, 
    checkpoint, 
    transactionId
  );
}
