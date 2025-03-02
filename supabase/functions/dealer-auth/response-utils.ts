
// Standard response utilities for dealer authentication functions

/**
 * Standard success response format
 */
export function respondSuccess(data: any = {}, message: string = "Operation successful") {
  return {
    success: true,
    message,
    ...data
  };
}

/**
 * Standard error response format
 */
export function respondError(error: string | Error, statusCode: number = 400) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    success: false,
    error: errorMessage,
    status: statusCode
  };
}

/**
 * Format validation errors
 */
export function validationErrorResponse(errors: Record<string, string>) {
  return respondError("Validation failed", 422);
}

/**
 * Authentication error response
 */
export function authErrorResponse(message: string = "Authentication failed") {
  return respondError(message, 401);
}

// For backward compatibility with existing code that might use these names
export const successResponse = respondSuccess;
export const errorResponse = respondError;
