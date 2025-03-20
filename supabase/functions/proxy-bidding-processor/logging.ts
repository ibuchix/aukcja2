
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

/**
 * Logs a retry attempt with detailed diagnostics
 */
export async function logRetryAttempt(
  module: string,
  operation: string,
  attempt: number,
  maxRetries: number,
  error: any,
  context: Record<string, any> = {}
) {
  console.log(`[RETRY] ${module}/${operation} - Attempt ${attempt}/${maxRetries} failed: ${error instanceof Error ? error.message : String(error)}`);
  
  const supabase = createServiceClient();
  
  // Don't use retry for the retry log itself to avoid potential infinite loops
  try {
    await supabase.from('system_logs').insert({
      log_type: 'retry',
      module,
      operation,
      details: {
        attempt,
        max_retries: maxRetries,
        error: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack : null,
        context,
        timestamp: new Date().toISOString()
      }
    });
  } catch (logError) {
    // Just console log if we can't store in database
    console.error(`Failed to log retry attempt: ${logError instanceof Error ? logError.message : String(logError)}`);
  }
}

/**
 * Logs system performance metrics
 */
export async function logPerformanceMetrics(
  module: string,
  operation: string,
  durationMs: number,
  success: boolean,
  metrics: Record<string, any> = {}
) {
  console.log(`[PERF] ${module}/${operation} - Duration: ${durationMs}ms, Success: ${success}`);
  
  const supabase = createServiceClient();
  
  try {
    await supabase.from('performance_metrics').insert({
      module,
      operation,
      duration_ms: durationMs,
      success,
      details: {
        ...metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (logError) {
    console.error(`Failed to log performance metrics: ${logError instanceof Error ? logError.message : String(logError)}`);
  }
}
