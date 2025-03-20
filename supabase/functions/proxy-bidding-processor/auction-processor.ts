
import { createServiceClient } from '../_shared/supabase-client.ts';
import { executeWithRetry } from '../_shared/retry-utils.ts';
import { Car, ProcessResult, ProxyBid } from './types.ts';
import { createCheckpointLogger, logProxyBid } from './logging.ts';
import { processTransaction } from './transaction.ts';
import { calculateNextBidAmount } from './bid-calculator.ts';

/**
 * Process a single auction with transaction tracking
 */
export async function processAuctionWithTransaction(
  auction: Car
): Promise<ProcessResult> {
  return await processTransaction(
    auction,
    async (auction, checkpoint, transactionId) => {
      return await processAuction(auction, transactionId);
    }
  );
}

/**
 * Process a single auction
 */
async function processAuction(
  auction: Car, 
  transactionId: string
): Promise<ProcessResult> {
  const supabase = createServiceClient();
  const { id: carId, current_bid, minimum_bid_increment, price } = auction;
  
  // Default to 250 if minimum_bid_increment is not set
  const bidIncrement = minimum_bid_increment || 250;
  
  console.log(`Processing auction ${carId} with current bid ${current_bid} and increment ${bidIncrement}`);
  
  // Create a checkpoint logger for this auction
  const checkpoint = await createCheckpointLogger(carId, transactionId);
  
  await checkpoint('fetch_proxy_bids');
  
  // 1. Get all proxy bids for this auction, ordered by max amount (highest first)
  const { data: proxyBids, error: proxyBidsError } = await executeWithRetry(async () => {
    return await supabase
      .from('proxy_bids')
      .select('*')
      .eq('car_id', carId)
      .order('max_bid_amount', { ascending: false });
  }, {
    maxRetries: 5,
    baseDelay: 500,
    jitter: true,
    onRetry: (attempt, delay, error) => {
      console.log(`Retrying fetch_proxy_bids (attempt ${attempt}) in ${delay}ms due to: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  if (proxyBidsError) {
    console.error(`Error fetching proxy bids for auction ${carId}:`, proxyBidsError.message);
    await checkpoint('error', { error: proxyBidsError.message, stage: 'fetch_proxy_bids' });
    return { carId, processed: false, reason: `Error fetching proxy bids: ${proxyBidsError.message}` };
  }
  
  if (!proxyBids || proxyBids.length === 0) {
    console.log(`No proxy bids found for auction ${carId}`);
    await checkpoint('skipped', { reason: 'No proxy bids found' });
    return { carId, processed: false, reason: 'No proxy bids found' };
  }
  
  if (proxyBids.length === 1) {
    console.log(`Only one proxy bid found for auction ${carId}, nothing to process`);
    await checkpoint('skipped', { reason: 'Only one proxy bid found' });
    return { carId, processed: false, reason: 'Only one proxy bid found' };
  }
  
  console.log(`Found ${proxyBids.length} proxy bids for auction ${carId}`);
  await checkpoint('proxy_bids_found', { count: proxyBids.length });
  
  return await processProxyBidding(carId, proxyBids, current_bid, price, bidIncrement, checkpoint, transactionId);
}

/**
 * Process the proxy bidding logic for an auction
 */
async function processProxyBidding(
  carId: string,
  proxyBids: ProxyBid[],
  currentBid: number,
  price: number,
  bidIncrement: number,
  checkpoint: (stage: string, details?: Record<string, any>) => Promise<any>,
  transactionId: string
): Promise<ProcessResult> {
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

/**
 * Place a bid on behalf of a dealer
 */
async function placeBid(
  carId: string,
  dealerId: string,
  bidAmount: number,
  maxProxyAmount: number,
  currentBid: number | undefined,
  outbidDealerId: string | undefined,
  checkpoint: (stage: string, details?: Record<string, any>) => Promise<any>,
  transactionId: string
): Promise<ProcessResult> {
  const supabase = createServiceClient();

  // Place the bid via the place_bid function with retry logic
  const { data: placeBidResult, error: placeBidError } = await executeWithRetry(async () => {
    return await supabase.rpc(
      'place_bid',
      {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: bidAmount,
        p_is_proxy: true,
        p_max_proxy_amount: maxProxyAmount
      }
    );
  }, {
    // Most critical operation - use more retries and aggressive backoff
    maxRetries: 7,
    baseDelay: 300,
    maxDelay: 10000,
    jitter: true,
    shouldRetry: (error) => {
      // Determine if this specific error is retryable
      // Don't retry if it's a validation error or other non-retryable error
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      
      // Don't retry obvious validation errors
      if (errorStr.includes('bid amount is too low') || 
          errorStr.includes('auction is not currently active') ||
          errorStr.includes('you cannot bid on your own vehicle')) {
        return false;
      }
      
      // Default to the standard retry classification
      return true;
    },
    onRetry: (attempt, delay, error) => {
      console.log(`Retrying place_bid (attempt ${attempt}/${7}) in ${delay}ms for auction ${carId} due to: ${error instanceof Error ? error.message : String(error)}`);
      checkpoint('place_bid_retry', { attempt, delay, error: String(error) });
    }
  });
  
  if (placeBidError) {
    console.error(`Error placing proxy bid for auction ${carId}:`, placeBidError.message);
    await checkpoint('error', { 
      error: placeBidError.message,
      stage: 'place_bid'
    });
    return { carId, processed: false, reason: `Error placing bid: ${placeBidError.message}` };
  }
  
  console.log(`Successfully placed proxy bid for auction ${carId}:`, placeBidResult);
  await checkpoint('bid_placed', { 
    result: placeBidResult,
    amount: bidAmount
  });
  
  // Log the action with retry
  await executeWithRetry(async () => {
    await logProxyBid(
      carId,
      dealerId,
      bidAmount,
      maxProxyAmount,
      currentBid,
      outbidDealerId,
      transactionId
    );
  }, {
    maxRetries: 3,
    baseDelay: 500
  });
  
  await checkpoint('complete', { success: true });
  
  return { 
    carId, 
    processed: true, 
    newBid: bidAmount, 
    previousBid: currentBid 
  };
}
