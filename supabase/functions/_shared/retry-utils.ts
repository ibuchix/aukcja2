
import { HttpError } from "./error-handling.ts";

/**
 * Classifies error types to determine if they're retryable
 */
export function isRetryableError(error: unknown): boolean {
  // Convert error to string for pattern matching
  const errorString = typeof error === 'string' 
    ? error 
    : error instanceof Error 
      ? error.message 
      : JSON.stringify(error);
  
  const errorText = errorString.toLowerCase();
  
  // Network and connectivity errors are retryable
  if (
    errorText.includes("network") ||
    errorText.includes("connection") ||
    errorText.includes("timeout") ||
    errorText.includes("econnreset") ||
    errorText.includes("socket") ||
    errorText.includes("unavailable") ||
    errorText.includes("aborted")
  ) {
    return true;
  }
  
  // Database transaction conflicts
  if (
    errorText.includes("deadlock") ||
    errorText.includes("lock timeout") ||
    errorText.includes("duplicate key") ||
    errorText.includes("serialization") ||
    errorText.includes("conflict") ||
    errorText.includes("concurrent")
  ) {
    return true;
  }
  
  // Service unavailable or server errors (5xx)
  if (
    errorText.includes("503") ||
    errorText.includes("500") ||
    errorText.includes("502") ||
    errorText.includes("504") ||
    errorText.includes("unexpected_failure") ||
    errorText.includes("internal server error") ||
    errorText.includes("rate limit") ||
    errorText.includes("too many requests") ||
    errorText.includes("429")
  ) {
    return true;
  }
  
  // Check for HTTP error status codes that should be retried
  if (error instanceof HttpError) {
    return error.status >= 500 || error.status === 429;
  }
  
  return false;
}

/**
 * Options for retry operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  
  /** Maximum delay cap in milliseconds (default: 15000) */
  maxDelay?: number;
  
  /** Whether to add jitter to the delay (default: true) */
  jitter?: boolean;
  
  /** Function to determine if an error is retryable (default: isRetryableError) */
  shouldRetry?: (error: unknown) => boolean;
  
  /** Optional callback for retry attempts */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
  
  /** Optional timeout in milliseconds for each attempt */
  timeout?: number;
}

/**
 * Result object for retry operations
 */
export interface RetryResult<T> {
  /** The result of the operation if successful */
  data: T | null;
  
  /** The error if the operation failed */
  error: unknown | null;
  
  /** Whether the operation was successful */
  success: boolean;
  
  /** Number of retry attempts made */
  attempts: number;
}

/**
 * Utility for retrying operations with exponential backoff
 * @param operation The async operation to retry
 * @param options Retry configuration options
 * @returns A promise that resolves to the operation result
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 15000,
    jitter = true,
    shouldRetry = isRetryableError,
    onRetry = (attempt, delay, error) => console.log(`Retry attempt ${attempt} in ${delay}ms due to: ${error instanceof Error ? error.message : String(error)}`)
  } = options;
  
  let retryCount = 0;
  let lastError: unknown;

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
      let delay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
      
      // Add jitter (±25%) to prevent thundering herd problem
      if (jitter) {
        const jitterFactor = 0.75 + Math.random() * 0.5; // Between 0.75 and 1.25
        delay = Math.floor(delay * jitterFactor);
      }
      
      // Log retry attempt
      onRetry(retryCount + 1, delay, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}

/**
 * Executes an operation with retry logic and returns a structured result
 * instead of throwing exceptions
 */
export async function executeWithRetryResult<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  let attempts = 0;
  
  try {
    const result = await executeWithRetry(
      () => {
        attempts++;
        return operation();
      },
      options
    );
    
    return {
      data: result,
      error: null,
      success: true,
      attempts
    };
  } catch (error) {
    return {
      data: null,
      error,
      success: false,
      attempts
    };
  }
}

/**
 * Wraps a Supabase query with retry logic
 * Useful for Supabase queries that don't follow standard Promise patterns
 */
export async function withSupabaseRetry<T>(
  query: any, // Supabase query builder
  options: RetryOptions = {}
): Promise<T> {
  return executeWithRetry(async () => {
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data as T;
  }, options);
}
