
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { handleError, withErrorHandling } from '../_shared/error-handling.ts';
import { checkForRateLimit } from '../_shared/rate-limiter.ts';
import { processProxyBids } from './processor.ts';
import { ProcessSummary } from './types.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return withErrorHandling(async () => {
    // Check for rate limiting using client IP
    const clientIP = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await checkForRateLimit(clientIP, 'proxy-bidding-processor', 60, 5);
    
    if (rateLimitResult.isLimited) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests', 
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      );
    }
    
    // Check if this is a manual invocation or automated
    const isManual = req.method === 'POST';
    
    // Process the proxy bids
    const result: ProcessSummary = await processProxyBids();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors,
        results: isManual ? result.results : undefined,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }, {
    module: 'proxy-bidding-processor',
    action: 'process'
  });
});

// Add a scheduled run for this function
// This is a commented example - cron jobs need to be set up in the database
// Deno.cron("process-proxy-bids", "*/15 * * * *", async () => {
//   console.log("Running scheduled proxy bid processing");
//   try {
//     await processProxyBids();
//   } catch (err) {
//     console.error("Error in scheduled proxy bid processing:", err);
//   }
// });
