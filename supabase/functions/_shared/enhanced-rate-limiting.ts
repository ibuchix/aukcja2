/**
 * Enhanced Rate Limiting with DDoS Protection
 * Replaces the simple in-memory rate limiting with distributed, database-backed protection
 */

interface EnhancedRateLimitResult {
  allowed: boolean;
  current_count: number;
  burst_count: number;
  retry_after: number;
  suspicion_score: number;
  should_block: boolean;
  source: 'distributed' | 'emergency' | 'fallback';
  processing_time: number;
  emergency_mode?: {
    active: boolean;
    mode_type?: string;
  };
}

interface RateLimitConfig {
  requests_per_minute?: number;
  burst_limit?: number;
  endpoint?: string;
  user_type?: 'anonymous' | 'authenticated';
}

/**
 * Enhanced rate limiting function using distributed storage and pattern analysis
 */
export async function checkEnhancedRateLimit(
  supabaseClient: any,
  identifier: string,
  request: Request,
  config: RateLimitConfig = {}
): Promise<EnhancedRateLimitResult> {
  const startTime = performance.now();
  
  try {
    // Extract request details
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const url = new URL(request.url);
    const endpoint = config.endpoint || url.pathname;

    // Get rate limit configuration from database if not provided
    let finalConfig = config;
    if (!config.requests_per_minute) {
      try {
        const { data: dbConfig, error } = await supabaseClient
          .from('rate_limit_configs')
          .select('*')
          .eq('is_active', true)
          .ilike('endpoint_pattern', endpoint.replace(/\/[^/]*$/g, '/*'))
          .eq('user_type', config.user_type || 'anonymous')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && dbConfig) {
          finalConfig = {
            requests_per_minute: dbConfig.requests_per_minute,
            burst_limit: dbConfig.burst_limit,
            ...config
          };
        }
      } catch (error) {
        console.warn('Could not fetch rate limit config from database:', error);
      }
    }

    // Call the enhanced rate limiter function
    const response = await fetch(`https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/enhanced-rate-limiter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseClient.supabaseKey}`,
        'X-Forwarded-For': clientIP,
        'User-Agent': userAgent
      },
      body: JSON.stringify({
        identifier,
        endpoint,
        ip_address: clientIP,
        user_agent: userAgent,
        requests_per_minute: finalConfig.requests_per_minute || 30,
        burst_limit: finalConfig.burst_limit || 5,
        method: request.method,
        path: url.pathname
      })
    });

    if (!response.ok) {
      // If rate limiter fails, fall back to allowing the request
      console.warn('Enhanced rate limiter failed, falling back to permissive mode');
      return {
        allowed: true,
        current_count: 0,
        burst_count: 0,
        retry_after: 0,
        suspicion_score: 0,
        should_block: false,
        source: 'fallback',
        processing_time: performance.now() - startTime
      };
    }

    const result = await response.json();
    return {
      ...result,
      processing_time: performance.now() - startTime
    };

  } catch (error) {
    console.error('Enhanced rate limit check failed:', error);
    
    // Fallback to allowing request
    return {
      allowed: true,
      current_count: 0,
      burst_count: 0,
      retry_after: 0,
      suspicion_score: 0,
      should_block: false,
      source: 'fallback',
      processing_time: performance.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Create a rate limited response with enhanced headers
 */
export function createEnhancedRateLimitedResponse(
  result: EnhancedRateLimitResult,
  corsHeaders: any
): Response {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Remaining': Math.max(0, result.current_count).toString(),
    'X-RateLimit-Reset': Math.floor((Date.now() + (result.retry_after * 1000)) / 1000).toString(),
    'X-Suspicion-Score': result.suspicion_score.toString(),
    'X-Protection-Source': result.source,
    ...(result.retry_after && { 'Retry-After': result.retry_after.toString() })
  };

  // Add emergency mode headers if active
  if (result.emergency_mode?.active) {
    headers['X-Emergency-Mode'] = result.emergency_mode.mode_type || 'active';
  }

  const statusCode = result.allowed ? 200 : 429;
  const responseBody = {
    error: result.allowed ? null : "Request blocked by DDoS protection",
    message: result.allowed ? 
      "Request allowed" : 
      result.emergency_mode?.active ? 
        `Emergency mode active: ${result.emergency_mode.mode_type}` :
        `Rate limit exceeded. Try again in ${result.retry_after} seconds`,
    details: {
      suspicion_score: result.suspicion_score,
      current_count: result.current_count,
      burst_count: result.burst_count,
      protection_source: result.source,
      processing_time: result.processing_time
    },
    retry_after: result.retry_after || undefined
  };

  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers
  });
}

/**
 * Middleware for protecting edge function endpoints
 */
export async function protectEndpoint(
  supabaseClient: any,
  request: Request,
  identifier: string,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; response?: Response; result?: EnhancedRateLimitResult }> {
  const rateLimitResult = await checkEnhancedRateLimit(supabaseClient, identifier, request, config);
  
  if (!rateLimitResult.allowed) {
    return {
      allowed: false,
      response: createEnhancedRateLimitedResponse(rateLimitResult, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }),
      result: rateLimitResult
    };
  }

  return {
    allowed: true,
    result: rateLimitResult
  };
}

/**
 * Log security event with enhanced context
 */
export async function logSecurityEvent(
  supabaseClient: any,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  request: Request,
  details: Record<string, any> = {}
) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';
    
    const url = new URL(request.url);
    
    await supabaseClient
      .from('ddos_events')
      .insert({
        event_type: eventType,
        severity,
        source_ip: clientIP,
        target_endpoint: url.pathname,
        details: {
          ...details,
          user_agent: request.headers.get('user-agent'),
          method: request.method,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}