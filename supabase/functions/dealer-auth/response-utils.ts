
// Standard response utilities for dealer authentication functions

/**
 * Standard success response format
 */
export function successResponse(data: any = {}, message: string = "Operation successful") {
  return {
    success: true,
    message,
    ...data
  };
}

/**
 * Standard error response format
 */
export function errorResponse(error: string | Error, code: string = "general_error", status: number = 400) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    success: false,
    error: errorMessage,
    code,
    status
  };
}

/**
 * Format validation errors
 */
export function validationErrorResponse(errors: Record<string, string>) {
  return errorResponse("Validation failed", "validation_error", 422);
}

/**
 * Authentication error response
 */
export function authErrorResponse(message: string = "Authentication failed") {
  return errorResponse(message, "auth_error", 401);
}
