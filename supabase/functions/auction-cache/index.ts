import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { connect } from 'https://deno.land/x/redis/mod.ts'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const redis = await connect({
  hostname: "redis.railway.internal",
  port: 6379,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, carId } = await req.json()

    switch (action) {
      case 'getAuctionDetails': {
        // Try to get from cache first
        const cacheKey = `auction:${carId}:details`
        let auctionDetails = await redis.get(cacheKey)

        if (!auctionDetails) {
          // Cache miss - fetch from database
          const { data, error } = await supabase
            .from('cars')
            .select(`
              *,
              bids (
                amount,
                created_at,
                dealer:dealers (dealership_name)
              )
            `)
            .eq('id', carId)
            .single()

          if (error) throw error

          // Store in cache with 5 minute TTL
          await redis.set(cacheKey, JSON.stringify(data), { ex: 300 })
          auctionDetails = data

          // Log cache miss
          await supabase
            .from('cache_metrics')
            .upsert({
              cache_key: cacheKey,
              miss_count: 1
            })
        } else {
          // Log cache hit
          await supabase
            .from('cache_metrics')
            .upsert({
              cache_key: cacheKey,
              hit_count: 1
            })
        }

        return new Response(
          JSON.stringify({ data: auctionDetails }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'invalidateCache': {
        // Invalidate all cache entries for this auction
        await redis.del(`auction:${carId}:details`)
        await redis.del(`auction:${carId}:bids`)
        
        return new Response(
          JSON.stringify({ message: 'Cache invalidated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})