
import { HttpError } from "./error-handling.ts";

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
  let lastError: any;

  while (retryCount <= maxRetries) {
    try {
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've reached max retries or this error shouldn't be retried
      if (retryCount >= maxRetries || !shouldRetry(error)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}
