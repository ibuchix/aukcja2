
/**
 * Utility for retrying operations with exponential backoff and enhanced logging
 */

// Type definition for Supabase-like responses
export interface SupabaseResponse<T = any> {
  data: T | null;
  error: any | null;
  [key: string]: any; // For any additional properties
}

// Type guard to check if a response is a Supabase-like response
function isSupabaseResponse(obj: any): obj is SupabaseResponse {
  return obj && typeof obj === 'object' && ('data' in obj || 'error' in obj);
}

// Import for the retry logger if available
let logRetryAttempt: any;
try {
  // Using dynamic import to avoid circular dependencies
  import('../proxy-bidding-processor/logging.ts')
    .then(module => {
      logRetryAttempt = module.logRetryAttempt;
    })
    .catch(() => {
      // If the specific logger is not available, we'll use console logging only
      logRetryAttempt = null;
    });
} catch {
  logRetryAttempt = null;
}

// Define retry statistics for monitoring
interface RetryStats {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
}

// In-memory stats for the current process
const retryStats: RetryStats = {
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0
};

/**
 * Get current retry statistics
 */
export function getRetryStats(): RetryStats {
  return { ...retryStats };
}

/**
 * Execute an operation with retry logic and comprehensive logging
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T> | any,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    shouldRetry?: (error: any) => boolean;
    onRetry?: (attempt: number, delay: number, error: any) => void;
    maxDelay?: number;
    jitter?: boolean;
    module?: string;
    operationName?: string;
    context?: Record<string, any>;
  } = {}
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
  retryStats.totalOperations++;

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
        retryStats.successfulOperations++;
        
        // Log performance metrics if the imported logger is available
        const durationMs = Date.now() - startTime;
        try {
          // This might fail if the module is not loaded or available
          const { logPerformanceMetrics } = await import('../proxy-bidding-processor/logging.ts');
          await logPerformanceMetrics(module, operationName, durationMs, true, {
            retries: retryCount,
            ...context
          });
        } catch {
          // Fallback to console logging
          console.log(`[PERF] ${module}/${operationName} completed successfully after ${retryCount} retries in ${durationMs}ms`);
        }
        
        return result;
      } catch (error: any) {
        // Don't retry if the error doesn't meet criteria or we've reached the limit
        if (!shouldRetry(error) || retryCount >= maxRetries) {
          // Log the final failure
          try {
            if (logRetryAttempt) {
              await logRetryAttempt(
                module,
                operationName,
                retryCount + 1,
                maxRetries,
                error,
                { ...context, final: true }
              );
            }
          } catch {}
          
          retryStats.failedOperations++;
          throw error;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          baseDelay * Math.pow(2, retryCount),
          maxDelay
        );
        
        // Apply jitter to prevent thundering herd problem
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        // Update retry stats
        retryStats.totalRetries++;
        
        // Log retry information
        console.log(`Retrying ${module}/${operationName} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(retryCount + 1, delay, error);
        }
        
        // Log retry attempt in database if logger is available
        try {
          if (logRetryAttempt) {
            await logRetryAttempt(
              module,
              operationName,
              retryCount + 1,
              maxRetries,
              error,
              context
            );
          }
        } catch {}
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }
  } catch (finalError) {
    // Calculate total duration
    const durationMs = Date.now() - startTime;
    
    // Log final performance metrics for the failed operation
    try {
      const { logPerformanceMetrics } = await import('../proxy-bidding-processor/logging.ts');
      await logPerformanceMetrics(module, operationName, durationMs, false, {
        retries: retryCount,
        error: finalError instanceof Error ? finalError.message : String(finalError),
        ...context
      });
    } catch {
      console.error(`[PERF] ${module}/${operationName} failed after ${retryCount} retries in ${durationMs}ms: ${finalError instanceof Error ? finalError.message : String(finalError)}`);
    }
    
    throw finalError;
  }
}
