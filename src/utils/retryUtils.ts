
/**
 * Type definition for Supabase-like responses
 */
export interface SupabaseResponse<T = any> {
  data: T | null;
  error: any | null;
  [key: string]: any; // For any additional properties
}

/**
 * Type guard to check if a response is a Supabase-like response
 */
function isSupabaseResponse(obj: any): obj is SupabaseResponse {
  return obj && typeof obj === 'object' && ('data' in obj || 'error' in obj);
}

/**
 * Utility for retrying operations with exponential backoff
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
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = false,
    shouldRetry = () => true,
    onRetry
  } = options;
  
  let retryCount = 0;

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
      
      return result;
    } catch (error: any) {
      // Don't retry if the error doesn't meet criteria or we've reached the limit
      if (!shouldRetry(error) || retryCount >= maxRetries) {
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
      
      // Log retry information
      console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(retryCount + 1, delay, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }
}
