
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { handleError, withErrorHandling } from '../_shared/error-handling.ts';
import { applyRateLimit, createRateLimitedResponse } from '../_shared/rate-limiting/index.ts';
import { processProxyBids } from './core.ts';
import { handleProxyBidRequest, createCorsResponse } from './api.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return createCorsResponse();
  }

  return withErrorHandling(async () => {
    // Apply rate limiting using the new middleware
    const clientIP = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await applyRateLimit(req, 'proxy-bidding', clientIP);
    
    if (rateLimitResult.limited) {
      return createRateLimitedResponse(rateLimitResult.result, corsHeaders);
    }
    
    // Process the proxy bids through the API handler
    return await handleProxyBidRequest(req, processProxyBids);
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
