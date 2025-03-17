
import { corsHeaders } from '../_shared/cors.ts';
import { ProcessSummary } from './types.ts';

/**
 * Handles processing proxy bids via HTTP
 */
export async function handleProxyBidRequest(
  req: Request, 
  processFn: () => Promise<ProcessSummary>
) {
  // Check if this is a manual invocation or automated
  const isManual = req.method === 'POST';
  
  // Process the proxy bids
  const result = await processFn();
  
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
}

/**
 * Creates a CORS options response
 */
export function createCorsResponse() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Creates a rate limit response
 */
export function createRateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({ 
      error: 'Too many requests', 
      retryAfter 
    }),
    { 
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}
