
/**
 * Centralized error handling utilities for Supabase Edge Functions
 */

import { corsHeaders } from "./cors.ts";

interface ErrorContext {
  module?: string;
  handler?: string;
  userId?: string;
  email?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
  headers?: Record<string, string>;
}

export type ErrorResponse = {
  error: string;
  referenceId: string;
  status: number;
  details?: string;
};

/**
 * Handles errors in a standardized way across all edge functions
 * @param error The error that occurred
 * @param context Additional context about where/when the error occurred
 * @returns A formatted Response object with appropriate status code
 */
export const handleError = (error: Error, context: ErrorContext = {}): Response => {
  const errorId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // Extract HTTP status if it's a known HTTP error
  const status = isHttpError(error) ? error.status : 500;
  
  // Format the error log with additional context
  console.error(JSON.stringify({
    errorId,
    timestamp,
    message: error.message,
    stack: error.stack,
    status,
    ...context
  }));
  
  // Default message for 500 errors to avoid leaking implementation details
  const publicMessage = status === 500 
    ? "Internal server error" 
    : error.message;
  
  // Merge provided headers with CORS headers to ensure they're always present
  const responseHeaders = {
    "Content-Type": "application/json",
    ...corsHeaders,  // Always include CORS headers
    ...(context.headers || {})  // Include any function-specific headers
  };
  
  // Create a standardized error response
  return new Response(
    JSON.stringify({
      error: publicMessage,
      referenceId: errorId,
      status,
      details: status !== 500 ? error.message : undefined
    }),
    { 
      status,
      headers: responseHeaders
    }
  );
};

/**
 * Type guard to check if an error has HTTP status information
 */
function isHttpError(error: any): error is { status: number } {
  return error && typeof error.status === 'number';
}

/**
 * Creates a standardized HTTP error with status code
 */
export class HttpError extends Error {
  status: number;
  
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends HttpError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthError extends HttpError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthError';
  }
}

/**
 * Authorization error for permission issues
 */
export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Too many requests error
 */
export class RateLimitError extends HttpError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Utility to wrap handler functions with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  context: ErrorContext = {}
): Promise<Response> {
  return handler()
    .then(result => {
      if (result instanceof Response) {
        // Make sure any direct Response objects also have CORS headers
        const headers = new Headers(result.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          if (!headers.has(key)) {
            headers.set(key, value);
          }
        });
        
        return new Response(result.body, {
          status: result.status,
          statusText: result.statusText,
          headers
        });
      }
      
      return new Response(
        typeof result === 'string' ? result : JSON.stringify(result),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders  // Add CORS headers to success responses
          }
        }
      );
    })
    .catch(error => handleError(error, context));
}
