
export interface RateLimitResult {
  limited: boolean;
  result: any;
  enhanced?: boolean;
  suspicion_score?: number;
  emergency_mode?: any;
}

// Legacy in-memory store for backwards compatibility
const ipLimits: Record<string, { count: number; resetAt: number }> = {};

/**
 * Enhanced rate limiting with DDoS protection
 * Uses distributed storage and pattern analysis
 */
export async function applyEnhancedRateLimit(
  req: Request,
  supabaseClient: any,
  limitKey: string,
  clientIP: string,
  config: {
    requests_per_minute?: number;
    burst_limit?: number;
    user_type?: 'anonymous' | 'authenticated';
  } = {}
): Promise<RateLimitResult> {
  const startTime = performance.now();
  
  try {
    const url = new URL(req.url);
    const identifier = `${limitKey}:${clientIP}`;
    
    // Call enhanced rate limiter edge function
    const response = await fetch(`https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/enhanced-rate-limiter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseClient.supabaseKey}`,
        'X-Forwarded-For': clientIP,
        'User-Agent': req.headers.get('user-agent') || 'unknown'
      },
      body: JSON.stringify({
        identifier,
        endpoint: url.pathname,
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent'),
        requests_per_minute: config.requests_per_minute || 30,
        burst_limit: config.burst_limit || 5,
        method: req.method,
        path: url.pathname
      })
    });

    if (!response.ok) {
      console.warn('Enhanced rate limiter failed, falling back to legacy system');
      return await applyRateLimit(req, limitKey, clientIP, config.requests_per_minute || 30);
    }

    const result = await response.json();
    
    return {
      limited: !result.allowed,
      result: {
        retryAfter: result.retry_after,
        current_count: result.current_count,
        suspicion_score: result.suspicion_score,
        emergency_mode: result.emergency_mode
      },
      enhanced: true,
      suspicion_score: result.suspicion_score,
      emergency_mode: result.emergency_mode
    };

  } catch (error) {
    console.error('Enhanced rate limit failed, falling back:', error);
    return await applyRateLimit(req, limitKey, clientIP, config.requests_per_minute || 30);
  }
}

/**
 * Legacy rate limiting for backwards compatibility
 * @deprecated Use applyEnhancedRateLimit instead
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
