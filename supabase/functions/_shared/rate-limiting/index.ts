
/**
 * Centralized rate limiting middleware for Supabase Edge Functions
 */

import { RateLimitStrategy } from "./types.ts";
import { InMemoryStrategy } from "./strategies/memory.ts";
import { RedisStrategy } from "./strategies/redis.ts";

// Default rate limiting settings
const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 60;

// Configuration for different endpoints
export const RATE_LIMIT_CONFIGS: Record<string, { 
  windowSeconds: number,
  maxRequests: number,
  identifierKey?: string
}> = {
  // Critical endpoints with stricter limits
  "auction-bidding": { windowSeconds: 10, maxRequests: 5, identifierKey: "dealer_id" },
  "dealer-verification": { windowSeconds: 300, maxRequests: 5, identifierKey: "ip" },
  "proxy-bidding": { windowSeconds: 60, maxRequests: 5, identifierKey: "ip" },
  
  // Regular API endpoints with standard limits
  "dealer-profile": { windowSeconds: 60, maxRequests: 30, identifierKey: "user_id" },
  "auction-info": { windowSeconds: 30, maxRequests: 20, identifierKey: "ip" },
  
  // Default config for unlisted endpoints
  "default": { windowSeconds: DEFAULT_WINDOW_SECONDS, maxRequests: DEFAULT_MAX_REQUESTS }
};

// Get appropriate rate limiting strategy based on environment
export function getRateLimitStrategy(): RateLimitStrategy {
  // Check if Redis connection details are available in environment
  const redisHost = Deno.env.get("REDISHOST");
  const redisPassword = Deno.env.get("REDISPASSWORD");
  
  // Use Redis if available, otherwise fallback to in-memory
  if (redisHost && redisPassword) {
    console.log("Using Redis rate limiting strategy");
    return new RedisStrategy();
  }
  
  console.log("Using in-memory rate limiting strategy");
  return new InMemoryStrategy();
}

/**
 * Gets the appropriate rate limit configuration for an endpoint
 */
export function getRateLimitConfig(endpointKey: string) {
  return RATE_LIMIT_CONFIGS[endpointKey] || RATE_LIMIT_CONFIGS["default"];
}

/**
 * Extract identifier for rate limiting from request
 * @param req The incoming request
 * @param identifierKey What to use as identifier (ip, user_id, etc)
 */
export function extractIdentifier(req: Request, identifierKey: string = "ip"): string {
  // Extract client IP from headers
  if (identifierKey === "ip") {
    return req.headers.get("x-real-ip") || 
           req.headers.get("x-forwarded-for") || 
           "unknown-ip";
  }
  
  // For user-based rate limiting, attempt to extract user ID from authorization
  if (identifierKey === "user_id") {
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        // Simplified JWT parsing to extract user ID from token
        // In a real implementation, proper JWT validation would be required
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sub || "anonymous";
      } catch (e) {
        console.error("Failed to extract user ID from token:", e);
      }
    }
    return "anonymous";
  }
  
  // For custom identifiers, expect them in the request body
  return "custom";  // This would be replaced with actual extraction logic
}

/**
 * Apply rate limiting to a request
 * 
 * @param req The incoming request
 * @param endpointKey The key identifying the endpoint in the config
 * @param overrideConfig Optional config to override the default for this endpoint
 * @returns An object indicating if the request is rate limited and headers to add
 */
export async function applyRateLimit(
  req: Request, 
  endpointKey: string,
  identifier?: string,
  overrideConfig?: { windowSeconds?: number, maxRequests?: number }
) {
  // Get the appropriate configuration
  const config = {
    ...getRateLimitConfig(endpointKey),
    ...overrideConfig
  };
  
  // Get the strategy
  const strategy = getRateLimitStrategy();
  
  // Extract the identifier if not provided
  const rateLimitId = identifier || extractIdentifier(req, config.identifierKey);
  
  // Apply the rate limit
  const result = await strategy.check(
    `${endpointKey}:${rateLimitId}`,
    config.windowSeconds,
    config.maxRequests
  );
  
  // Prepare headers
  const headers = {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString()
  };
  
  if (result.limited) {
    headers["Retry-After"] = result.retryAfter.toString();
  }
  
  return {
    limited: result.limited,
    headers,
    config,
    identifier: rateLimitId,
    result
  };
}

/**
 * Create a rate-limited response
 */
export function createRateLimitedResponse(result: { retryAfter: number }, corsHeaders: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded",
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": result.retryAfter.toString(),
        ...corsHeaders
      }
    }
  );
}
