
import { SignupResult } from "./types";

// Detect network related errors
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('network') ||
      errorMsg.includes('fetch') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('cors') ||
      errorMsg.includes('503') ||
      errorMsg.includes('unavailable')
    );
  }
  return false;
}

// Detect auth service errors
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('unexpected_failure') ||
      errorMsg.includes('authapiError') ||
      errorMsg.includes('500')
    );
  }
  return false;
}

// Handle signup auth results
export function handleAuthResult(result: any): SignupResult {
  // Check for unexpected auth failures which often require a retry
  if (
    result.error?.includes('unexpected_failure') ||
    result.error?.includes('500') ||
    result.error?.includes('AuthApiError')
  ) {
    return {
      success: false,
      error: "Authentication service temporarily unavailable. Please try again in a few moments.",
      errorType: 'auth'
    };
  }

  // Check if the error is network-related
  if (
    result.error?.includes('network') ||
    result.error?.includes('timeout') ||
    result.error?.includes('unavailable') ||
    result.error?.includes('CORS') ||
    result.error?.includes('503')
  ) {
    return {
      success: false,
      error: "Network error connecting to authentication service. Please try again.",
      errorType: 'network'
    };
  }

  // Look for common error patterns to provide better messages
  if (result.error?.includes('already exists')) {
    return {
      success: false,
      error: "An account with this email already exists. Please try logging in instead.",
      errorType: 'auth'
    };
  }

  return {
    success: false,
    error: result.error || "Failed to create user account",
    errorType: 'auth'
  };
}

// Create a friendly error message from caught exceptions
export function createErrorFromException(error: unknown): SignupResult {
  console.error("Registration error:", error);
  
  if (isNetworkError(error)) {
    return {
      success: false,
      error: "Network connection issue. Please check your internet and try again.",
      errorType: 'network'
    };
  }
  
  if (isAuthError(error)) {
    return {
      success: false,
      error: "Authentication service is temporarily unavailable. Please try again in a few moments.",
      errorType: 'auth'
    };
  }
  
  return {
    success: false,
    error: error instanceof Error ? error.message : "An unexpected error occurred",
    errorType: 'validation'
  };
}
