
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { handleError, withErrorHandling } from '../_shared/error-handling.ts';
import { checkForRateLimit } from '../_shared/rate-limiter.ts';
import { processProxyBids } from './processor.ts';
import { handleProxyBidRequest, createCorsResponse, createRateLimitResponse } from './api.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return createCorsResponse();
  }

  return withErrorHandling(async () => {
    // Check for rate limiting using client IP
    const clientIP = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await checkForRateLimit(clientIP, 'proxy-bidding-processor', 60, 5);
    
    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult.retryAfter);
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
