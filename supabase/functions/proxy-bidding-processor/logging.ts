
import { createServiceClient } from '../_shared/supabase-client.ts';
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
    
    return await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'proxy_bid_checkpoint',
      entity_type: 'car',
      entity_id: carId,
      details: checkpointDetails
    });
  };
}

/**
 * Logs a transaction start
 */
export async function logTransactionStart(carId: string, transactionId: string) {
  const supabase = createServiceClient();
  
  return await supabase.from('audit_logs').insert({
    user_id: null,
    action: 'proxy_bid_transaction',
    entity_type: 'car',
    entity_id: carId,
    details: {
      transaction_id: transactionId,
      stage: 'start',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Logs a transaction completion
 */
export async function logTransactionComplete(
  carId: string, 
  transactionId: string, 
  success: boolean, 
  reason?: string
) {
  const supabase = createServiceClient();
  
  return await supabase.from('audit_logs').insert({
    user_id: null,
    action: 'proxy_bid_transaction',
    entity_type: 'car',
    entity_id: carId,
    details: {
      transaction_id: transactionId,
      stage: 'complete',
      result: success ? 'success' : 'skipped',
      reason,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Logs a transaction error
 */
export async function logTransactionError(carId: string, transactionId: string, error: unknown) {
  const supabase = createServiceClient();
  
  return await supabase.from('audit_logs').insert({
    user_id: null,
    action: 'proxy_bid_transaction',
    entity_type: 'car',
    entity_id: carId,
    details: {
      transaction_id: transactionId,
      stage: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  });
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
}
