
import { 
  getQueuedBids, 
  processBid
} from './bidQueueManager';
import { removeBidFromQueue } from './storage';

/**
 * Process all queued bids when back online
 */
export async function processBids(): Promise<{ success: number, failed: number }> {
  const queuedBids = getQueuedBids();
  let success = 0;
  let failed = 0;

  // Process each bid in the queue
  for (const bid of queuedBids) {
    try {
      const result = await processBid(bid);
      
      if (result) {
        success++;
        // Bid was successfully processed, so it's already removed from the queue by processBid
      } else {
        failed++;
        // If this bid has been tried too many times, remove it from the queue
        if (bid.attempts >= 3) {
          console.log(`Removing bid ${bid.id} after ${bid.attempts} failed attempts`);
          removeBidFromQueue(bid.id);
        }
      }
    } catch (error) {
      console.error(`Error processing bid ${bid.id}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
