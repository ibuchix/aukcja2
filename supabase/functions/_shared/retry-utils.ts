
import { SupabaseResponse, RetryOptions } from './retry/types';
import { isSupabaseResponse } from './retry/supabase-helpers';
import { getRetryStats, incrementStat } from './retry/stats';
import { logPerformance, logRetry } from './retry/logger';
import { calculateBackoff, sleep } from './retry/backoff';

export { SupabaseResponse, RetryOptions } from './retry/types';
export { isSupabaseResponse } from './retry/supabase-helpers';
export { getRetryStats } from './retry/stats';

/**
 * Utility for retrying operations with exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T> | any,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = false,
    shouldRetry = () => true,
    onRetry,
    module = 'unknown',
    operationName = 'unknown',
    context = {}
  } = options;
  
  let retryCount = 0;
  const startTime = Date.now();
  let success = false;
  
  // Update operation count
  incrementStat('totalOperations');

  try {
    while (true) {
      try {
        // Execute the operation and await the result
        // This handles both regular promises and Supabase query builders
        const result = await operation();
        
        // For Supabase responses, check if there's an error property
        // and throw it if it exists
        if (isSupabaseResponse(result) && result.error) {
          throw result.error;
        }
        
        // Operation succeeded
        success = true;
        incrementStat('successfulOperations');
        
        // Log performance metrics
        const durationMs = Date.now() - startTime;
        await logPerformance(module, operationName, durationMs, true, {
          retries: retryCount,
          ...context
        });
        
        return result;
      } catch (error: any) {
        // Don't retry if the error doesn't meet criteria or we've reached the limit
        if (!shouldRetry(error) || retryCount >= maxRetries) {
          // Log the final failure
          await logRetry(module, operationName, retryCount + 1, maxRetries, error, context, true);
          
          incrementStat('failedOperations');
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = calculateBackoff(baseDelay, retryCount, maxDelay, jitter);
        
        // Update retry stats
        incrementStat('totalRetries');
        
        // Log retry information
        console.log(`Retrying ${module}/${operationName} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(retryCount + 1, delay, error);
        }
        
        // Log retry attempt
        await logRetry(module, operationName, retryCount + 1, maxRetries, error, context);
        
        // Wait before retrying
        await sleep(delay);
        retryCount++;
      }
    }
  } catch (finalError) {
    // Calculate total duration
    const durationMs = Date.now() - startTime;
    
    // Log final performance metrics for the failed operation
    await logPerformance(module, operationName, durationMs, false, {
      retries: retryCount,
      error: finalError instanceof Error ? finalError.message : String(finalError),
      ...context
    });
    
    throw finalError;
  }
}
