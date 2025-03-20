/**
 * Rate limiting middleware for Supabase Edge Functions
 */

import { applyRateLimit, createRateLimitedResponse } from "../rate-limiting/index.ts";

/**
 * Creates a middleware function that applies rate limiting
 * 
 * @param endpointKey The key identifying the endpoint in the config
 * @param identifierFn Optional function to extract the identifier from the request
 * @param corsHeaders Optional CORS headers to include in the response
 * @param config Optional override config
 */
export function createRateLimitMiddleware(
  endpointKey: string,
  identifierFn?: (req: Request) => string | Promise<string>,
  corsHeaders: Record<string, string> = {},
  config?: { windowSeconds?: number, maxRequests?: number }
) {
  return async (req: Request): Promise<Response | null> => {
    // Extract identifier if custom function provided
    let identifier: string | undefined;
    if (identifierFn) {
      identifier = await Promise.resolve(identifierFn(req));
    }
    
    // Apply rate limiting
    const result = await applyRateLimit(req, endpointKey, identifier, config);
    
    // If limited, return rate limit response
    if (result.limited) {
      return createRateLimitedResponse(result.result, corsHeaders);
    }
    
    // Not limited, continue processing
    return null;
  };
}

/**
 * Apply middleware to a request handler
 * 
 * @param middleware The middleware function
 * @param handler The request handler
 */
export function withMiddleware(
  middleware: (req: Request) => Promise<Response | null>,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // Apply middleware
    const middlewareResponse = await middleware(req);
    
    // If middleware returned a response, return it
    if (middlewareResponse) {
      return middlewareResponse;
    }
    
    // Otherwise, continue to handler
    return await handler(req);
  };
}

/**
 * Apply multiple middleware functions to a request handler
 * 
 * @param middlewares Array of middleware functions
 * @param handler The request handler
 */
export function withMiddlewares(
  middlewares: Array<(req: Request) => Promise<Response | null>>,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // Apply each middleware in sequence
    for (const middleware of middlewares) {
      const response = await middleware(req);
      if (response) {
        return response;
      }
    }
    
    // If all middlewares pass, continue to handler
    return await handler(req);
  };
}
