
/**
 * Type definitions for rate limiting
 */

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfter: number;
  resetAt: number;
}

export interface RateLimitStrategy {
  /**
   * Check if a request should be rate limited
   * 
   * @param key The key to use for rate limiting
   * @param windowSeconds The time window in seconds
   * @param maxRequests The maximum number of requests allowed in the window
   */
  check(key: string, windowSeconds: number, maxRequests: number): Promise<RateLimitResult>;
  
  /**
   * Reset rate limit for a specific key
   * 
   * @param key The key to reset
   */
  reset(key: string): Promise<void>;
}
