
/**
 * Result type for profile operations
 */
export interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation' | 'network';
  partialSuccess?: boolean;
  warning?: string;
}

/**
 * Creates a success result
 */
export function createSuccessResult(): ProfileResult {
  return { success: true };
}

/**
 * Creates a partial success result with a warning
 */
export function createPartialSuccessResult(warning: string): ProfileResult {
  return {
    success: true,
    partialSuccess: true,
    warning
  };
}

/**
 * Creates a validation error result
 */
export function createValidationErrorResult(error: string): ProfileResult {
  return {
    success: false,
    error,
    errorType: 'validation'
  };
}

/**
 * Creates a database error result
 */
export function createDatabaseErrorResult(error: string): ProfileResult {
  return {
    success: false,
    error,
    errorType: 'database'
  };
}

/**
 * Creates a network error result
 */
export function createNetworkErrorResult(error: string): ProfileResult {
  return {
    success: false,
    error,
    errorType: 'network'
  };
}

/**
 * Processes a database error and returns an appropriate result
 */
export function handleDatabaseError(error: any): ProfileResult {
  console.error("Database error:", {
    error,
    errorCode: error.code,
    errorMessage: error.message,
    details: error.details
  });
  
  // Handle specific database constraint violations
  if (error.code === '23505') { // Unique violation
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('business_registry_number')) {
      return createValidationErrorResult("This business registry number (REGON) is already registered. Please verify your information or contact support.");
    }
    if (errorMessage.includes('tax_id')) {
      return createValidationErrorResult("This tax ID (NIP) is already registered. Please verify your information or contact support.");
    }
    return createValidationErrorResult("A unique constraint was violated. Please verify your information.");
  }

  // Detect network-related errors
  if (error.message && (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('connection') ||
    error.message.toLowerCase().includes('timeout') ||
    error.message.toLowerCase().includes('unavailable')
  )) {
    return createNetworkErrorResult(`Network error: ${error.message}`);
  }

  // Handle other database errors
  return createDatabaseErrorResult(`Database error: ${error.message}`);
}
