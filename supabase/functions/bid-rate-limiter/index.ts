import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

interface BidRateLimitEntry {
  count: number;
  resetAt: number;
  lastRequest: number;
}

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  source: 'edge' | 'database' | 'fallback';
  processingTime: number;
}

class EnhancedBidRateLimiter {
  private limits: Map<string, BidRateLimitEntry> = new Map();
  private supabase: any;
  
  constructor() {
    // Initialize Supabase client for fallback database operations
    this.supabase = createClient(
      'https://sdvakfhmoaoucmhbhwvy.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc5MjU5MSwiZXhwIjoyMDUwMzY4NTkxfQ.kUg9cXdJ4VzKb2pvqB4IUfGRN6oZJ8xXmUaFKCM0eJI'
    );
  }
  
  /**
   * Get Polish date in YYYY-MM-DD format
   * Handles CET/CEST timezone automatically
   */
  private getPolishDate(): string {
    const now = new Date();
    const polishTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Warsaw',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    return polishTime;
  }

  /**
   * Get next Polish midnight timestamp
   */
  private getNextPolishMidnight(): number {
    const today = this.getPolishDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Create midnight time in Polish timezone
    const midnightString = tomorrow.toISOString().split('T')[0] + 'T00:00:00';
    const midnightUTC = new Date(midnightString + '+01:00');
    
    // Convert to proper Polish timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Warsaw',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(midnightUTC);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    const nextMidnight = new Date(`${year}-${month}-${day}T00:00:00`);
    
    // Convert back to UTC timestamp
    return Date.UTC(nextMidnight.getFullYear(), nextMidnight.getMonth(), nextMidnight.getDate());
  }

  /**
   * Check bid limit using in-memory storage (primary method)
   */
  private async checkInMemoryLimit(dealerId: string): Promise<RateLimitResponse> {
    const startTime = performance.now();
    const polishDate = this.getPolishDate();
    const key = `dealer_${dealerId}_${polishDate}`;
    const now = Date.now();
    const maxBidsPerDay = 40;
    
    console.log(`[EDGE] Checking in-memory rate limit for dealer ${dealerId} on ${polishDate}`);
    
    // Get or create entry
    let entry = this.limits.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetAt: this.getNextPolishMidnight(),
        lastRequest: now
      };
      this.limits.set(key, entry);
      console.log(`[EDGE] Created new rate limit entry for ${key}`);
    }
    
    // Check if we need to reset (new Polish day)
    if (now > entry.resetAt) {
      console.log(`[EDGE] Resetting rate limit for ${key} - new day`);
      entry.count = 0;
      entry.resetAt = this.getNextPolishMidnight();
      entry.lastRequest = now;
    }
    
    const currentCount = entry.count;
    console.log(`[EDGE] Current bid count for ${dealerId}: ${currentCount}/${maxBidsPerDay}`);
    
    // Check if limit exceeded
    if (currentCount >= maxBidsPerDay) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      const processingTime = performance.now() - startTime;
      
      console.log(`[EDGE] Rate limit EXCEEDED for ${dealerId}. Retry after: ${retryAfter}s`);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter,
        source: 'edge',
        processingTime
      };
    }
    
    // Increment counter
    entry.count++;
    entry.lastRequest = now;
    
    const remaining = Math.max(0, maxBidsPerDay - entry.count);
    const processingTime = performance.now() - startTime;
    
    console.log(`[EDGE] Rate limit ALLOWED for ${dealerId}. Remaining: ${remaining}, Processing time: ${processingTime.toFixed(2)}ms`);
    
    // Clean up old entries
    this.cleanup();
    
    return {
      allowed: true,
      remaining,
      resetAt: entry.resetAt,
      source: 'edge',
      processingTime
    };
  }

  /**
   * Fallback to database-backed rate limiting
   */
  private async checkDatabaseLimit(dealerId: string): Promise<RateLimitResponse> {
    const startTime = performance.now();
    
    console.log(`[DATABASE] Checking database rate limit for dealer ${dealerId}`);
    
    try {
      const { data, error } = await this.supabase.rpc('check_dealer_bid_rate_limit', {
        p_dealer_id: dealerId
      });
      
      const processingTime = performance.now() - startTime;
      
      if (error) {
        console.error(`[DATABASE] Rate limit check failed:`, error);
        throw error;
      }
      
      console.log(`[DATABASE] Rate limit result:`, data);
      
      return {
        allowed: data.allowed,
        remaining: data.remaining || 0,
        resetAt: new Date(data.reset_at).getTime(),
        retryAfter: data.allowed ? undefined : Math.ceil((new Date(data.reset_at).getTime() - Date.now()) / 1000),
        source: 'database',
        processingTime
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`[DATABASE] Database rate limit check failed:`, error);
      throw error;
    }
  }

  /**
   * Check bid limit with hybrid approach (edge first, database fallback)
   */
  async checkBidLimit(dealerId: string, useDatabase = false): Promise<RateLimitResponse> {
    const startTime = performance.now();
    
    console.log(`[HYBRID] Starting rate limit check for dealer ${dealerId}, useDatabase: ${useDatabase}`);
    
    try {
      // Try in-memory first unless explicitly requested to use database
      if (!useDatabase) {
        try {
          const result = await this.checkInMemoryLimit(dealerId);
          console.log(`[HYBRID] In-memory check completed successfully`);
          return result;
        } catch (error) {
          console.warn(`[HYBRID] In-memory check failed, falling back to database:`, error);
        }
      }
      
      // Fallback to database
      const result = await this.checkDatabaseLimit(dealerId);
      console.log(`[HYBRID] Database check completed successfully`);
      return result;
      
    } catch (error) {
      // Ultimate fallback - allow request with warning
      const processingTime = performance.now() - startTime;
      console.error(`[HYBRID] All rate limiting methods failed, allowing request:`, error);
      
      return {
        allowed: true,
        remaining: 39,
        resetAt: Date.now() + 86400000, // 24 hours from now
        source: 'fallback',
        processingTime
      };
    }
  }

  private cleanup() {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 86400000 * 2; // 2 days in milliseconds
    let cleanedCount = 0;
    
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.lastRequest > CLEANUP_THRESHOLD) {
        this.limits.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[CLEANUP] Removed ${cleanedCount} old rate limit entries`);
    }
  }

  /**
   * Get health status and metrics
   */
  getHealthStatus() {
    const memoryUsage = this.limits.size;
    const now = Date.now();
    
    let activeEntries = 0;
    let totalBids = 0;
    
    for (const [_, entry] of this.limits.entries()) {
      if (now < entry.resetAt) {
        activeEntries++;
        totalBids += entry.count;
      }
    }
    
    return {
      status: 'healthy',
      memoryUsage,
      activeEntries,
      totalBids,
      timestamp: now
    };
  }
}

const enhancedBidRateLimiter = new EnhancedBidRateLimiter();

serve(async (req) => {
  const requestStart = performance.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  console.log(`[REQUEST] ${req.method} ${req.url} from ${clientIP}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Preflight request handled`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Health check endpoint
  if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/health')) {
    const health = enhancedBidRateLimiter.getHealthStatus();
    console.log(`[HEALTH] Health check requested:`, health);
    
    return new Response(
      JSON.stringify({
        ...health,
        processingTime: performance.now() - requestStart
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    if (req.method !== 'POST') {
      console.warn(`[ERROR] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.json();
    const { dealerId, useDatabase = false } = body;

    if (!dealerId) {
      console.warn(`[ERROR] Missing dealerId in request`);
      return new Response(
        JSON.stringify({ error: 'dealerId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[PROCESSING] Rate limit check for dealer ${dealerId}, useDatabase: ${useDatabase}`);

    const result = await enhancedBidRateLimiter.checkBidLimit(dealerId, useDatabase);
    const totalProcessingTime = performance.now() - requestStart;
    
    // Add request metadata to response
    const response = {
      ...result,
      totalProcessingTime,
      metadata: {
        clientIP,
        userAgent,
        timestamp: Date.now(),
        requestId: crypto.randomUUID()
      }
    };

    const status = result.allowed ? 200 : 429;
    
    console.log(`[RESPONSE] Status: ${status}, Allowed: ${result.allowed}, Source: ${result.source}, Processing: ${totalProcessingTime.toFixed(2)}ms`);
    
    return new Response(
      JSON.stringify(response),
      { 
        status, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(result.resetAt / 1000).toString(),
          ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
        } 
      }
    );

  } catch (error) {
    const totalProcessingTime = performance.now() - requestStart;
    console.error(`[ERROR] Unhandled error in rate limiter:`, error);
    
    // Fail open - allow the bid if rate limiter has issues
    const fallbackResponse = {
      allowed: true, 
      remaining: 39, 
      resetAt: Date.now() + 86400000, // 24 hours from now
      source: 'fallback',
      processingTime: totalProcessingTime,
      error: 'Rate limiter unavailable - allowing request',
      metadata: {
        clientIP,
        userAgent,
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        errorMessage: error.message
      }
    };
    
    return new Response(
      JSON.stringify(fallbackResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});