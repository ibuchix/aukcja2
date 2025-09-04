
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { respondError } from "./response-utils.ts";
import { logRequest, logError, logInfo } from "./logging.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { applyRateLimit, createRateLimitedResponse } from "../_shared/rate-limiting/index.ts";
import { handleDealerAuthRequest } from "./route-handler.ts";
import { environmentValid } from "./environment.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();
    logRequest(req);

    // Debug environment vars (without revealing actual values)
    logInfo(`Environment check: SUPABASE_URL exists: ${!!Deno.env.get("SUPABASE_URL")}, SERVICE_ROLE_KEY exists: ${!!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`);

    // Apply enhanced rate limiting to dealer auth requests
    const clientIP = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const { applyEnhancedRateLimit } = await import("../_shared/rate-limiting/index.ts");
    const rateLimitResult = await applyEnhancedRateLimit(req, supabase, 'dealer-authentication', clientIP, {
      requests_per_minute: 5, // Stricter for auth
      burst_limit: 2,
      user_type: 'anonymous'
    });
    
    if (rateLimitResult.limited) {
      logInfo(`Enhanced rate limit exceeded for IP: ${clientIP}, suspicion: ${rateLimitResult.suspicion_score}`);
      return createRateLimitedResponse(rateLimitResult.result, corsHeaders);
    }

    // Verify environment is properly configured
    if (!environmentValid) {
      return respondError("Server configuration error", 500);
    }

    // Process the request through our request handler
    return await handleDealerAuthRequest(req, startTime);
  } catch (error) {
    // Handle unexpected errors
    logError("Unhandled exception in dealer-auth function", error);
    return respondError(
      `Internal server error: ${error.message}`,
      500
    );
  }
});
