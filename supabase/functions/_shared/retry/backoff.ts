
/**
 * Calculate delay with exponential backoff
 */
export function calculateBackoff(
  baseDelay: number,
  retryCount: number,
  maxDelay: number,
  useJitter: boolean = false
): number {
  // Calculate exponential backoff
  let delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  
  // Apply jitter to prevent thundering herd problem
  if (useJitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return delay;
}

/**
 * Sleep for the specified duration
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
