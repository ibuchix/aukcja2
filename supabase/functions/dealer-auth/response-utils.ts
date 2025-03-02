
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Creates a standardized success response
 */
export function successResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
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
      error: error,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}
