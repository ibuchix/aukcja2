
/**
 * Rate limiting functionality for Supabase Edge Functions
 * Simple in-memory implementation (for demo purposes)
 */

// Store for rate limit counters - will reset on function restarts
const rateLimits: Record<string, { count: number, lastReset: number }> = {};

export interface RateLimitResult {
  isLimited: boolean;
  retryAfter: number;
}

/**
 * Check if a request should be rate limited
 * @param key The key to use for rate limiting (e.g. IP address, user ID)
 * @param prefix A prefix to add to the key (e.g. function name)
 * @param windowSeconds The time window in seconds
 * @param maxRequests The maximum number of requests allowed in the time window
 * @returns Whether the request is rate limited and retry time if limited
 */
export async function checkForRateLimit(
  key: string,
  prefix: string,
  windowSeconds: number,
  maxRequests: number
): Promise<RateLimitResult> {
  // Create a combined key for the rate limit
  const limitKey = `${prefix}:${key}`;
  const now = Date.now();
  
  // Initialize or get current entry
  let entry = rateLimits[limitKey];
  if (!entry) {
    entry = { count: 0, lastReset: now };
    rateLimits[limitKey] = entry;
  }
  
  // Check if window has expired and reset if needed
  if (now - entry.lastReset > windowSeconds * 1000) {
    entry.count = 0;
    entry.lastReset = now;
  }
  
  // Increment counter
  entry.count += 1;
  
  // Check if over limit
  if (entry.count > maxRequests) {
    // Calculate retry time
    const retryAfter = Math.ceil((entry.lastReset + windowSeconds * 1000 - now) / 1000);
    return { isLimited: true, retryAfter: retryAfter > 0 ? retryAfter : 1 };
  }
  
  return { isLimited: false, retryAfter: 0 };
}
