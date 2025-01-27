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

async function checkCacheHealth() {
  try {
    // Check Redis connection
    await redis.ping();
    
    // Analyze cache metrics
    const { data: metrics, error } = await supabase
      .from('cache_metrics')
      .select('*')
      .gte('last_accessed', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const alerts = [];
    
    // Analyze each cache key's performance
    for (const metric of metrics) {
      const total = metric.hit_count + metric.miss_count;
      const hitRatio = total > 0 ? metric.hit_count / total : 0;

      // Alert if hit ratio is below 50%
      if (total > 100 && hitRatio < 0.5) {
        alerts.push({
          type: 'low_hit_ratio',
          cache_key: metric.cache_key,
          hit_ratio: hitRatio,
          message: `Low cache hit ratio (${(hitRatio * 100).toFixed(1)}%) for key: ${metric.cache_key}`
        });
      }
    }

    // Log alerts
    if (alerts.length > 0) {
      console.error('Cache Performance Alerts:', JSON.stringify(alerts, null, 2));
    }

    return alerts;
  } catch (error) {
    console.error('Cache health check failed:', error);
    return [{
      type: 'system_error',
      message: error.message
    }];
  }
}

// Run health check every 5 minutes
Deno.cron("cache-health-check", "*/5 * * * *", async () => {
  console.log("Running cache health check");
  await checkCacheHealth();
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const alerts = await checkCacheHealth();
    return new Response(
      JSON.stringify({ alerts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});