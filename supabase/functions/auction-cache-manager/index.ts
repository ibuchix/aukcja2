import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { connect } from 'https://deno.land/x/redis/mod.ts'

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

async function warmUpcomingAuctions() {
  const { data: upcomingAuctions, error } = await supabase
    .from('cars')
    .select(`
      *,
      bids (
        amount,
        created_at,
        dealer:dealers (dealership_name)
      )
    `)
    .eq('is_auction', true)
    .eq('auction_status', 'pending')
    .lt('auction_start_time', new Date(Date.now() + 30 * 60 * 1000).toISOString()) // Next 30 minutes
    .order('auction_start_time', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming auctions:', error);
    return;
  }

  for (const auction of upcomingAuctions) {
    const cacheKey = `auction:${auction.id}:details`;
    await redis.set(cacheKey, JSON.stringify(auction), { ex: 1800 }); // 30 minutes TTL
    console.log(`Warmed up cache for auction ${auction.id}`);
  }
}

async function updateRealTimeData(carId: string) {
  const cacheKey = `auction:${carId}:details`;
  
  // Get latest data
  const { data: auction, error } = await supabase
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
    .single();

  if (error) {
    console.error('Error fetching auction data:', error);
    return;
  }

  // Update cache with new data
  await redis.set(cacheKey, JSON.stringify(auction), { ex: 300 }); // 5 minutes TTL
  console.log(`Updated cache for auction ${carId}`);
}

Deno.cron("warm-cache", "*/15 * * * *", async () => {
  console.log("Running cache warming job");
  await warmUpcomingAuctions();
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, carId } = await req.json();

    switch (action) {
      case 'warmCache':
        await warmUpcomingAuctions();
        return new Response(
          JSON.stringify({ message: 'Cache warmed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'updateRealTime':
        if (!carId) throw new Error('carId is required');
        await updateRealTimeData(carId);
        return new Response(
          JSON.stringify({ message: 'Real-time data updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});