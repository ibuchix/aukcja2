
/**
 * In-memory rate limiting strategy
 * 
 * Simple implementation for development or low-traffic environments.
 * Not suitable for production use with multiple function instances.
 */

import { RateLimitStrategy, RateLimitResult } from "../types.ts";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  lastRequest: number;
}

export class InMemoryStrategy implements RateLimitStrategy {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  async check(key: string, windowSeconds: number, maxRequests: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    // Get or create entry
    let entry = this.limits.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
        lastRequest: now
      };
      this.limits.set(key, entry);
    }
    
    // Check if the window has expired
    if (now > entry.resetAt) {
      // Reset for a new window
      entry.count = 0;
      entry.resetAt = now + windowMs;
      entry.lastRequest = now;
    }
    
    // Increment the counter
    entry.count++;
    entry.lastRequest = now;
    
    // Check if over limit
    const limited = entry.count > maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    
    // Clean up old entries periodically
    this.cleanup();
    
    return {
      limited,
      remaining,
      retryAfter,
      resetAt: entry.resetAt
    };
  }
  
  async reset(key: string): Promise<void> {
    this.limits.delete(key);
  }
  
  private cleanup() {
    const now = Date.now();
    // Remove entries older than 1 hour to prevent memory leaks
    const CLEANUP_THRESHOLD = 3600000; // 1 hour in milliseconds
    
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.lastRequest > CLEANUP_THRESHOLD) {
        this.limits.delete(key);
      }
    }
  }
}
