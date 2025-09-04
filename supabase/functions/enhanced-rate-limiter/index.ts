import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from "../_shared/cors.ts";

interface EnhancedRateLimitRequest {
  identifier: string;
  endpoint: string;
  ip_address?: string;
  user_agent?: string;
  requests_per_minute?: number;
  burst_limit?: number;
  method?: string;
  path?: string;
}

interface EnhancedRateLimitResponse {
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

class EnhancedDDoSProtection {
  private supabase: any;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.supabase = createClient(
      'https://sdvakfhmoaoucmhbhwvy.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc5MjU5MSwiZXhwIjoyMDUwMzY4NTkxfQ.kUg9cXdJ4VzKb2pvqB4IUfGRN6oZJ8xXmUaFKCM0eJI'
    );
  }

  async checkEmergencyMode(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('emergency_mode')
        .select('*')
        .eq('is_active', true)
        .order('activated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking emergency mode:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception checking emergency mode:', error);
      return null;
    }
  }

  async checkDistributedRateLimit(request: EnhancedRateLimitRequest): Promise<EnhancedRateLimitResponse> {
    const startTime = performance.now();
    
    try {
      // Check emergency mode first
      const emergencyMode = await this.checkEmergencyMode();
      
      if (emergencyMode) {
        const config = emergencyMode.config || {};
        
        switch (emergencyMode.mode_type) {
          case 'full_lockdown':
            return {
              allowed: false,
              current_count: 0,
              burst_count: 0,
              retry_after: 3600,
              suspicion_score: 100,
              should_block: true,
              source: 'emergency',
              processing_time: performance.now() - startTime,
              emergency_mode: {
                active: true,
                mode_type: emergencyMode.mode_type
              }
            };
            
          case 'enhanced_filtering':
            // Apply stricter rate limits
            request.requests_per_minute = Math.floor((request.requests_per_minute || 30) * 0.5);
            request.burst_limit = Math.floor((request.burst_limit || 5) * 0.3);
            break;
            
          case 'selective_blocking':
            // Check if IP is in blocked list
            const blockedIPs = config.blocked_ips || [];
            if (request.ip_address && blockedIPs.includes(request.ip_address)) {
              return {
                allowed: false,
                current_count: 0,
                burst_count: 0,
                retry_after: 1800,
                suspicion_score: 100,
                should_block: true,
                source: 'emergency',
                processing_time: performance.now() - startTime,
                emergency_mode: {
                  active: true,
                  mode_type: emergencyMode.mode_type
                }
              };
            }
            break;
        }
      }

      // Use distributed rate limiting function
      const { data: rateLimitResult, error } = await this.supabase
        .rpc('check_distributed_rate_limit', {
          p_identifier: request.identifier,
          p_endpoint: request.endpoint,
          p_ip_address: request.ip_address || null,
          p_user_agent: request.user_agent || null,
          p_requests_per_minute: request.requests_per_minute || 30,
          p_burst_limit: request.burst_limit || 5
        });

      if (error) {
        console.error('Rate limit check failed:', error);
        throw error;
      }

      // Analyze request patterns for suspicion scoring
      let patternResult = { suspicion_score: 0, should_block: false };
      
      if (request.ip_address && request.path) {
        try {
          const { data: patternData, error: patternError } = await this.supabase
            .rpc('analyze_request_pattern', {
              p_ip_address: request.ip_address,
              p_user_agent: request.user_agent || '',
              p_request_path: request.path,
              p_request_method: request.method || 'GET'
            });

          if (patternError) {
            console.error('Pattern analysis failed:', patternError);
          } else {
            patternResult = patternData;
          }
        } catch (error) {
          console.error('Pattern analysis exception:', error);
        }
      }

      // Record system health metrics
      try {
        await this.supabase.rpc('record_system_health_metric', {
          p_metric_name: 'rate_limit_requests_per_minute',
          p_metric_value: rateLimitResult.current_count,
          p_threshold_value: request.requests_per_minute || 30
        });
      } catch (error) {
        console.error('Health metric recording failed:', error);
      }

      const processingTime = performance.now() - startTime;
      
      return {
        allowed: rateLimitResult.allowed && !patternResult.should_block,
        current_count: rateLimitResult.current_count || 0,
        burst_count: rateLimitResult.burst_count || 0,
        retry_after: rateLimitResult.retry_after || 0,
        suspicion_score: patternResult.suspicion_score || 0,
        should_block: patternResult.should_block || false,
        source: 'distributed',
        processing_time,
        emergency_mode: emergencyMode ? {
          active: true,
          mode_type: emergencyMode.mode_type
        } : { active: false }
      };

    } catch (error) {
      console.error('Enhanced rate limit check failed:', error);
      
      // Fallback to permissive mode with logging
      const processingTime = performance.now() - startTime;
      
      return {
        allowed: true,
        current_count: 0,
        burst_count: 0,
        retry_after: 0,
        suspicion_score: 0,
        should_block: false,
        source: 'fallback',
        processing_time,
        emergency_mode: { active: false }
      };
    }
  }

  async getSystemStatus() {
    try {
      const [emergencyMode, recentEvents, healthMetrics] = await Promise.all([
        this.checkEmergencyMode(),
        this.supabase
          .from('ddos_events')
          .select('*')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10),
        this.supabase
          .from('system_health')
          .select('*')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      return {
        emergency_mode: emergencyMode || { active: false },
        recent_events: recentEvents.data || [],
        health_metrics: healthMetrics.data || [],
        cache_size: this.cache.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('System status check failed:', error);
      return {
        emergency_mode: { active: false },
        recent_events: [],
        health_metrics: [],
        cache_size: this.cache.size,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

const ddosProtection = new EnhancedDDoSProtection();

serve(async (req) => {
  const requestStart = performance.now();
  const url = new URL(req.url);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Health check endpoint
  if (req.method === 'GET' && url.pathname.endsWith('/health')) {
    try {
      const status = await ddosProtection.getSystemStatus();
      return new Response(
        JSON.stringify({
          ...status,
          response_time: performance.now() - requestStart
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Health check failed',
          message: error.message,
          response_time: performance.now() - requestStart
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Rate limit check endpoint
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      req.headers.get('cf-connecting-ip') ||
                      'unknown';
      
      const request: EnhancedRateLimitRequest = {
        identifier: body.identifier || clientIP,
        endpoint: body.endpoint || url.pathname,
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent') || undefined,
        requests_per_minute: body.requests_per_minute,
        burst_limit: body.burst_limit,
        method: req.method,
        path: url.pathname
      };

      const result = await ddosProtection.checkDistributedRateLimit(request);
      const status = result.allowed ? 200 : 429;

      return new Response(
        JSON.stringify({
          ...result,
          metadata: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            client_ip: clientIP,
            total_processing_time: performance.now() - requestStart
          }
        }),
        {
          status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': Math.max(0, (request.requests_per_minute || 30) - result.current_count).toString(),
            'X-RateLimit-Reset': Math.floor((Date.now() + (result.retry_after * 1000)) / 1000).toString(),
            'X-Suspicion-Score': result.suspicion_score.toString(),
            ...(result.retry_after && { 'Retry-After': result.retry_after.toString() })
          }
        }
      );
    } catch (error) {
      console.error('Rate limit request failed:', error);
      
      return new Response(
        JSON.stringify({
          allowed: true, // Fail open
          error: 'Rate limiter unavailable',
          message: error.message,
          source: 'fallback',
          processing_time: performance.now() - requestStart
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});