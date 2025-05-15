
export interface RateLimitResult {
  limited: boolean;
  result: any;
}

/**
 * Simple in-memory rate limiting mechanism
 * In a production environment, you would use Redis or another persistent store
 */
const ipLimits: Record<string, { count: number; resetAt: number }> = {};

/**
 * Apply rate limiting based on client IP
 */
export async function applyRateLimit(
  req: Request, 
  limitKey: string, 
  clientIP: string,
  requestsPerMinute: number = 30
): Promise<RateLimitResult> {
  const key = `${limitKey}:${clientIP}`;
  const now = Date.now();
  
  // Initialize or reset expired limits
  if (!ipLimits[key] || ipLimits[key].resetAt <= now) {
    ipLimits[key] = {
      count: 0,
      resetAt: now + 60 * 1000 // 1 minute from now
    };
  }
  
  // Increment counter
  ipLimits[key].count++;
  
  // Check if limit exceeded
  if (ipLimits[key].count > requestsPerMinute) {
    return { 
      limited: true,
      result: {
        retryAfter: Math.ceil((ipLimits[key].resetAt - now) / 1000)
      }
    };
  }
  
  return { limited: false, result: null };
}

/**
 * Create a rate limited response
 */
export function createRateLimitedResponse(result: any, corsHeaders: any): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      retryAfter: result.retryAfter || 60
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": `${result.retryAfter || 60}`
      }
    }
  );
}
