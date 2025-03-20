
import { createServiceClient } from '../_shared/supabase-client.ts';
import { executeWithRetry } from '../_shared/retry-utils.ts';
import { createCheckpointLogger, logProxyBid } from './logging.ts';

/**
 * Place a bid on behalf of a dealer
 */
export async function placeBid(
  carId: string,
  dealerId: string,
  bidAmount: number,
  maxProxyAmount: number,
  currentBid: number | undefined,
  outbidDealerId: string | undefined,
  checkpoint: (stage: string, details?: Record<string, any>) => Promise<any>,
  transactionId: string
) {
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
    module: 'auction-processor',
    operationName: 'place_bid',
    context: { 
      carId, 
      dealerId, 
      bidAmount, 
      maxProxyAmount,
      transactionId
    },
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
    baseDelay: 500,
    module: 'auction-processor',
    operationName: 'log_proxy_bid',
    context: { 
      carId, 
      dealerId, 
      bidAmount, 
      transactionId 
    }
  });
  
  await checkpoint('complete', { success: true });
  
  return { 
    carId, 
    processed: true, 
    newBid: bidAmount, 
    previousBid: currentBid 
  };
}
