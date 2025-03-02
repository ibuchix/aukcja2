
/**
 * Utility for retrying operations with exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T> | any,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = () => true
  } = options;
  
  let retryCount = 0;

  while (true) {
    try {
      // Execute the operation and await the result
      // This handles both regular promises and Supabase query builders
      const result = await operation();
      
      // For Supabase responses, check if there's an error property
      // and throw it if it exists
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        throw result.error;
      }
      
      return result;
    } catch (error: any) {
      // Don't retry if the error doesn't meet criteria or we've reached the limit
      if (!shouldRetry(error) || retryCount >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }
}
