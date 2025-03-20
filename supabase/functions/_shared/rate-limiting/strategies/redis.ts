
/**
 * Redis-based rate limiting strategy
 * 
 * Suitable for production use with multiple function instances.
 */

import { connect } from "https://deno.land/x/redis/mod.ts";
import { RateLimitStrategy, RateLimitResult } from "../types.ts";

export class RedisStrategy implements RateLimitStrategy {
  private redis: any | null = null;
  private connected = false;
  
  constructor() {
    this.initializeConnection();
  }
  
  private async initializeConnection() {
    try {
      if (!this.connected) {
        this.redis = await connect({
          hostname: Deno.env.get("REDISHOST") || "",
          port: parseInt(Deno.env.get("REDISPORT") || "6379"),
          password: Deno.env.get("REDISPASSWORD")
        });
        this.connected = true;
        console.log("Connected to Redis for rate limiting");
      }
    } catch (error) {
      console.error("Redis connection error:", error);
      this.connected = false;
      throw new Error("Failed to connect to Redis");
    }
  }
  
  async check(key: string, windowSeconds: number, maxRequests: number): Promise<RateLimitResult> {
    // Make sure connection is initialized
    if (!this.connected) {
      await this.initializeConnection();
    }
    
    // Create a Redis key with proper prefix
    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    try {
      // Get the current count
      const value = await this.redis.get(redisKey);
      let count = value ? parseInt(value, 10) : 0;
      let ttl = await this.redis.ttl(redisKey);
      
      // If key doesn't exist yet or TTL is -1 (no expiry), set up the initial state
      if (!value || ttl < 0) {
        count = 0;
        ttl = windowSeconds;
        // Set initial value with expiry
        await this.redis.setex(redisKey, windowSeconds, "0");
      }
      
      // Increment the counter
      count = await this.redis.incr(redisKey);
      
      // Calculate remaining requests and reset time
      const remaining = Math.max(0, maxRequests - count);
      const resetAt = now + (ttl * 1000);
      const limited = count > maxRequests;
      
      return {
        limited,
        remaining,
        retryAfter: ttl,
        resetAt
      };
    } catch (error) {
      console.error("Redis rate limiting error:", error);
      
      // Fail open - allow the request but log the error
      return {
        limited: false,
        remaining: maxRequests,
        retryAfter: 0,
        resetAt: now + windowMs
      };
    }
  }
  
  async reset(key: string): Promise<void> {
    if (!this.connected) {
      await this.initializeConnection();
    }
    
    const redisKey = `ratelimit:${key}`;
    await this.redis.del(redisKey);
  }
}
