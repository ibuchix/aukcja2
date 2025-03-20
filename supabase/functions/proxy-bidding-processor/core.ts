
import { createServiceClient } from '../_shared/supabase-client.ts';
import { executeWithRetry } from '../_shared/retry-utils.ts';
import { Car, ProcessResult, ProxyBid, ProcessSummary } from './types.ts';
import { createCheckpointLogger } from './logging.ts';
import { processAuctionWithTransaction } from './auction-processor.ts';

/**
 * Process all proxy bids for active auctions
 */
export async function processProxyBids(): Promise<ProcessSummary> {
  const supabase = createServiceClient();
  const startTime = Date.now();
  const results: ProcessResult[] = [];
  
  console.log('Starting proxy bid processing job');
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  try {
    // 1. Get all active auctions with retry
    const { data: activeAuctions, error: auctionsError } = await executeWithRetry(async () => {
      return await supabase
        .from('cars')
        .select('id, current_bid, minimum_bid_increment, auction_status, price')
        .eq('is_auction', true)
        .eq('auction_status', 'active');
    }, {
      maxRetries: 5,
      baseDelay: 500,
      jitter: true,
      module: 'proxy-bid-processor',
      operationName: 'fetch_active_auctions'
    });
    
    if (auctionsError) {
      console.error('Error fetching active auctions:', auctionsError.message);
      throw auctionsError;
    }
    
    console.log(`Found ${activeAuctions?.length || 0} active auctions to process`);
    
    // 2. Process each auction
    for (const auction of activeAuctions || []) {
      try {
        // Process the auction with transaction handling
        const result = await processAuctionWithTransaction(auction);
        
        results.push(result);
        
        if (result.processed) {
          processed++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Error processing auction ${auction.id}:`, err);
        results.push({
          carId: auction.id,
          processed: false,
          reason: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
        errors++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Proxy bid processing completed in ${duration}ms. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
    
    // Log performance metrics for the overall job
    try {
      const { logPerformanceMetrics } = await import('./logging.ts');
      await logPerformanceMetrics('proxy-bid-processor', 'process_all', duration, errors === 0, {
        auctions_processed: processed,
        auctions_skipped: skipped,
        auctions_errored: errors,
        total_auctions: activeAuctions?.length || 0
      });
    } catch (e) {
      console.error(`Failed to log overall performance metrics: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    return { processed, skipped, errors, results };
  } catch (err) {
    console.error('Error in processProxyBids:', err);
    
    // Log the failure
    try {
      const { logPerformanceMetrics } = await import('./logging.ts');
      const duration = Date.now() - startTime;
      await logPerformanceMetrics('proxy-bid-processor', 'process_all', duration, false, {
        error: err instanceof Error ? err.message : String(err),
        auctions_processed: processed,
        auctions_skipped: skipped,
        auctions_errored: errors
      });
    } catch {}
    
    throw err;
  }
}
