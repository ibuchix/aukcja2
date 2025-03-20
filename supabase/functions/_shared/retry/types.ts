
/**
 * Type definition for Supabase-like responses
 */
export interface SupabaseResponse<T = any> {
  data: T | null;
  error: any | null;
  [key: string]: any; // For any additional properties
}

/**
 * Interface for retry operations statistics
 */
export interface RetryStats {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
}

/**
 * Options for retry execution
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, delay: number, error: any) => void;
  maxDelay?: number;
  jitter?: boolean;
  module?: string;
  operationName?: string;
  context?: Record<string, any>;
}
