
import { useState } from "react";

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
}

export interface RetryState {
  retries: number;
  isRetrying: boolean;
}

export interface UseNetworkRetryResult {
  retryState: RetryState;
  incrementRetry: () => void;
  resetRetry: () => void;
  shouldRetry: () => boolean;
  getDelayMs: () => number;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    errorPredicate?: (error: unknown) => boolean
  ) => Promise<T>;
}

export function useNetworkRetry(config: RetryConfig): UseNetworkRetryResult {
  const [retries, setRetries] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const resetRetry = () => setRetries(0);
  const incrementRetry = () => setRetries((prev) => prev + 1);
  const shouldRetry = () => retries < config.maxRetries;
  
  const getDelayMs = () => {
    // Exponential backoff with a cap
    return Math.min(config.baseDelayMs * Math.pow(2, retries), 8000);
  };
  
  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    errorPredicate?: (error: unknown) => boolean
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      // Check if this is a retryable error
      const shouldRetryError = errorPredicate ? errorPredicate(error) : true;
      
      if (shouldRetryError && shouldRetry()) {
        incrementRetry();
        setIsRetrying(true);
        
        // Add delay before retry
        const delayMs = getDelayMs();
        console.log(`Retrying operation in ${delayMs}ms... (Attempt ${retries + 1} of ${config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        setIsRetrying(false);
        return operation();
      }
      
      throw error;
    }
  };
  
  return {
    retryState: { retries, isRetrying },
    incrementRetry,
    resetRetry,
    shouldRetry,
    getDelayMs,
    executeWithRetry
  };
}
