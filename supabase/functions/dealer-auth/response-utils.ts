
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Create a successful response with proper CORS headers
 */
export function respondSuccess(body: any, requestId?: string): Response {
  return new Response(
    JSON.stringify(body),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
        ...(requestId ? { "X-Request-ID": requestId } : {})
      }
    }
  );
}

/**
 * Create an error response with proper CORS headers
 */
export function respondError(message: string, status = 400, requestId?: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
        ...(requestId ? { "X-Request-ID": requestId } : {})
      }
    }
  );
}
