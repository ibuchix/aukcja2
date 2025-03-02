
/**
 * Utility for retrying operations with exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
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
      return await operation();
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
