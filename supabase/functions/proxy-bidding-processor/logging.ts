
import { createServiceClient } from '../_shared/supabase-client.ts';
import { executeWithRetry } from '../_shared/retry-utils.ts';
import { CheckpointDetails } from './types.ts';

/**
 * Creates a checkpoint logging function for a specific auction
 */
export function createCheckpointLogger(carId: string, transactionId: string) {
  const supabase = createServiceClient();
  
  return async function checkpoint(stage: string, details: Record<string, any> = {}) {
    console.log(`Checkpoint [${transactionId}] - ${stage}: ${JSON.stringify(details)}`);
    
    const checkpointDetails: CheckpointDetails = {
      transaction_id: transactionId,
      stage,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    return await executeWithRetry(async () => {
      return await supabase.from('audit_logs').insert({
        user_id: null,
        action: 'proxy_bid_checkpoint',
        entity_type: 'car',
        entity_id: carId,
        details: checkpointDetails
      });
    });
  };
}

/**
 * Logs a successful proxy bid
 */
export async function logProxyBid(
  carId: string, 
  dealerId: string, 
  bidAmount: number,
  maxAmount: number,
  previousBid: number | undefined,
  outbidDealerId: string | undefined,
  transactionId: string
) {
  const supabase = createServiceClient();
  
  return await executeWithRetry(async () => {
    return await supabase.from('audit_logs').insert({
      user_id: dealerId,
      action: 'proxy_bid',
      entity_type: 'car',
      entity_id: carId,
      details: {
        bid_amount: bidAmount,
        max_amount: maxAmount,
        outbid_dealer_id: outbidDealerId,
        previous_bid: previousBid,
        auto_processed: true,
        transaction_id: transactionId
      }
    });
  });
}
