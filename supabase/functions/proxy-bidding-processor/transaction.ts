
import { createServiceClient } from "../_shared/supabase-client.ts";
import { executeWithRetry } from "../_shared/retry-utils.ts";
import { Car, ProcessResult } from "./types.ts";
import { createCheckpointLogger } from "./logging.ts";

/**
 * Process an auction in the context of a transaction with checkpoint tracking
 */
export async function processTransaction(
  auction: Car,
  processFn: (
    auction: Car,
    checkpoint: (stage: string, details?: Record<string, any>) => Promise<any>,
    transactionId: string
  ) => Promise<ProcessResult>
): Promise<ProcessResult> {
  // Generate a unique transaction ID
  const transactionId = crypto.randomUUID();
  console.log(`Starting transaction ${transactionId} for auction ${auction.id}`);
  
  // Create checkpoint logger for this auction
  const checkpoint = await createCheckpointLogger(auction.id, transactionId);
  
  try {
    // Log transaction start
    await logTransactionStart(auction.id, transactionId);
    
    // Process the auction with the transaction context
    const result = await processFn(auction, checkpoint, transactionId);
    result.transaction_id = transactionId;
    
    // Log transaction completion
    await logTransactionComplete(auction.id, transactionId, result.processed, result.reason);
    
    return result;
  } catch (err) {
    console.error(`Error in transaction ${transactionId} for auction ${auction.id}:`, err);
    
    // Log transaction error
    await logTransactionError(auction.id, transactionId, err);
    
    // Return error result
    return {
      carId: auction.id,
      processed: false,
      reason: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      transaction_id: transactionId,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Logs a transaction start
 */
export async function logTransactionStart(carId: string, transactionId: string) {
  const supabase = createServiceClient();
  
  return await executeWithRetry(async () => {
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
  }, {
    module: 'transaction-manager',
    operationName: 'log_transaction_start',
    context: { carId, transactionId }
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
  
  return await executeWithRetry(async () => {
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
  }, {
    module: 'transaction-manager',
    operationName: 'log_transaction_complete',
    context: { carId, transactionId, success, reason }
  });
}

/**
 * Logs a transaction error
 */
export async function logTransactionError(carId: string, transactionId: string, error: unknown) {
  const supabase = createServiceClient();
  
  return await executeWithRetry(async () => {
    return await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'proxy_bid_transaction',
      entity_type: 'car',
      entity_id: carId,
      details: {
        transaction_id: transactionId,
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString()
      }
    });
  }, {
    module: 'transaction-manager',
    operationName: 'log_transaction_error',
    context: { carId, transactionId }
  });
}
