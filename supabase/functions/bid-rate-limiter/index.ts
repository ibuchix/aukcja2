import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface BidRateLimitEntry {
  count: number;
  resetAt: number;
  lastRequest: number;
}

class BidRateLimiter {
  private limits: Map<string, BidRateLimitEntry> = new Map();
  
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
    const midnightUTC = new Date(midnightString + '+01:00'); // Approximate - will be adjusted
    
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
   * Check if dealer can place a bid (40 bids per day limit)
   */
  async checkBidLimit(dealerId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  }> {
    const polishDate = this.getPolishDate();
    const key = `dealer_${dealerId}_${polishDate}`;
    const now = Date.now();
    const maxBidsPerDay = 40;
    
    // Get or create entry
    let entry = this.limits.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetAt: this.getNextPolishMidnight(),
        lastRequest: now
      };
      this.limits.set(key, entry);
    }
    
    // Check if we need to reset (new Polish day)
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = this.getNextPolishMidnight();
      entry.lastRequest = now;
    }
    
    // Check if limit exceeded
    if (entry.count >= maxBidsPerDay) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter
      };
    }
    
    // Increment counter
    entry.count++;
    entry.lastRequest = now;
    
    // Clean up old entries
    this.cleanup();
    
    return {
      allowed: true,
      remaining: Math.max(0, maxBidsPerDay - entry.count),
      resetAt: entry.resetAt
    };
  }

  private cleanup() {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 86400000 * 2; // 2 days in milliseconds
    
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.lastRequest > CLEANUP_THRESHOLD) {
        this.limits.delete(key);
      }
    }
  }
}

const bidRateLimiter = new BidRateLimiter();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { dealerId } = await req.json();

    if (!dealerId) {
      return new Response(
        JSON.stringify({ error: 'dealerId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await bidRateLimiter.checkBidLimit(dealerId);

    const status = result.allowed ? 200 : 429;
    
    return new Response(
      JSON.stringify(result),
      { 
        status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in bid rate limiter:', error);
    
    // Fail open - allow the bid if rate limiter has issues
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remaining: 39, 
        resetAt: Date.now() + 86400000, // 24 hours from now
        error: 'Rate limiter unavailable - allowing request'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});