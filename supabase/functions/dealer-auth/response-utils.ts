
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Creates a standardized success response
 */
export function successResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data
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

/**
 * Creates a standardized error response
 */
export function errorResponse(error: string, status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error
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

/**
 * Sanitizes error objects to strings for consistent error responses
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Creates a custom JSON response
 */
export function createResponse(body: any, status = 200, additionalHeaders = {}) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
        ...additionalHeaders
      }
    }
  );
}
