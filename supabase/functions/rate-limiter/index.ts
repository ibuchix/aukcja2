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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, endpoint, userId } = await req.json()

    // Handle auction rate limit reset
    if (action === 'reset_auction_limits') {
      console.log('Resetting auction rate limits...')
      
      // Get all auction-related rate limit keys
      const auctionKeys = await redis.keys('ratelimit:auction_*')
      
      // Delete all auction-related rate limit entries
      for (const key of auctionKeys) {
        await redis.del(key)
      }
      
      console.log(`Reset ${auctionKeys.length} auction rate limit entries`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auction rate limits reset successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle regular rate limiting
    if (!endpoint || !userId) {
      throw new Error('Missing required parameters')
    }

    // Get rate limit configuration from database
    const { data: rateLimitConfig, error: configError } = await supabase
      .from('rate_limits')
      .select('requests_limit, time_window')
      .eq('endpoint_name', endpoint)
      .single()

    if (configError) {
      console.error('Error fetching rate limit config:', configError)
      throw new Error('Failed to fetch rate limit configuration')
    }

    const key = `ratelimit:${endpoint}:${userId}`
    const current = await redis.get(key)
    const currentCount = current ? parseInt(current) : 0

    if (currentCount >= rateLimitConfig.requests_limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          resetIn: await redis.ttl(key)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Increment counter and set expiry if not exists
    await redis.incr(key)
    await redis.expire(key, rateLimitConfig.time_window)

    // Get remaining requests
    const remaining = rateLimitConfig.requests_limit - (currentCount + 1)

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining,
        resetIn: await redis.ttl(key)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rate limiting error:', error)
    
    // Fail open - allow the request but log the error
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: 999,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})