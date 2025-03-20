
import { createServiceClient } from '../_shared/supabase-client.ts';
import { executeWithRetry } from '../_shared/retry-utils.ts';
import { Car, ProcessResult, ProxyBid } from './types.ts';
import { createCheckpointLogger } from './logging.ts';
import { processTransaction } from './transaction.ts';
import { processProxyBidding } from './proxy-bidding.ts';

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
    module: 'auction-processor',
    operationName: 'fetch_proxy_bids',
    context: { carId, transactionId },
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
  
  return await processProxyBidding(
    carId, 
    proxyBids, 
    current_bid, 
    price, 
    bidIncrement, 
    checkpoint, 
    transactionId
  );
}
