
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Create a successful response with proper CORS headers
 */
export function respondSuccess(body: any, status = 200): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

/**
 * Create an error response with proper CORS headers
 */
export function respondError(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}
