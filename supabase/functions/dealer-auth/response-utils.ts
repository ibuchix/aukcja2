
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Creates a successful response with proper headers
 */
export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Creates an error response with proper headers
 */
export function createErrorResponse(
  message: string,
  status = 400,
  details?: Record<string, any>
): Response {
  const errorBody = {
    error: message,
    ...(details ? { details } : {})
  };

  return new Response(
    JSON.stringify(errorBody),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
