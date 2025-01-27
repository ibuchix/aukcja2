import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { connect } from "https://deno.land/x/redis/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const redis = await connect({
  hostname: Deno.env.get("REDISHOST") || "",
  port: parseInt(Deno.env.get("REDISPORT") || "6379"),
  password: Deno.env.get("REDISPASSWORD"),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

async function checkRateLimit(userId: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // Get rate limit configuration from database
    const { data: rateLimitConfig, error } = await supabase
      .from('rate_limits')
      .select('requests_limit, time_window')
      .eq('endpoint_name', endpoint)
      .single();

    if (error || !rateLimitConfig) {
      console.error('Error fetching rate limit config:', error);
      return { allowed: true, remaining: 0 }; // Fail open if config not found
    }

    const key = `ratelimit:${endpoint}:${userId}`;
    const current = await redis.get(key);
    const currentCount = current ? parseInt(current) : 0;

    if (currentCount >= rateLimitConfig.requests_limit) {
      return { allowed: false, remaining: 0 };
    }

    // Increment counter and set expiry
    await redis.incr(key);
    await redis.expire(key, rateLimitConfig.time_window);

    return {
      allowed: true,
      remaining: rateLimitConfig.requests_limit - (currentCount + 1)
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true, remaining: 0 }; // Fail open on errors
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, userId } = await req.json();

    if (!endpoint || !userId) {
      throw new Error('Missing required parameters');
    }

    const result = await checkRateLimit(userId, endpoint);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in rate-limiter function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});