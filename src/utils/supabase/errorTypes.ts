
/**
 * Standardized error types for Supabase operations
 */

// Basic error interface
export interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
  originalError?: any;
}

// Authentication error types
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'user_not_found'
  | 'session_expired'
  | 'not_authenticated'
  | 'invalid_token'
  | 'auth_general';

export interface AuthError extends SupabaseError {
  type: AuthErrorType;
}

// Database error types
export type DatabaseErrorType = 
  | 'row_not_found'
  | 'duplicate_value'
  | 'foreign_key_violation'
  | 'permission_denied'
  | 'query_invalid'
  | 'database_connection'
  | 'transaction_failed'
  | 'validation_failed'
  | 'database_general';

export interface DatabaseError extends SupabaseError {
  type: DatabaseErrorType;
  table?: string;
  column?: string;
}

// Storage error types
export type StorageErrorType = 
  | 'file_not_found'
  | 'permission_denied'
  | 'storage_limit_exceeded'
  | 'invalid_file_type'
  | 'upload_failed'
  | 'storage_general';

export interface StorageError extends SupabaseError {
  type: StorageErrorType;
  bucket?: string;
  path?: string;
}

// Network error types
export type NetworkErrorType =
  | 'timeout'
  | 'offline'
  | 'rate_limited'
  | 'server_error'
  | 'network_general';

export interface NetworkError extends SupabaseError {
  type: NetworkErrorType;
  status?: number;
}

// Edge function error types
export type EdgeFunctionErrorType =
  | 'function_not_found'
  | 'execution_failed'
  | 'timeout'
  | 'edge_general';

export interface EdgeFunctionError extends SupabaseError {
  type: EdgeFunctionErrorType;
  functionName?: string;
}

// Union type of all possible errors
export type SupabaseErrorUnion = 
  | AuthError 
  | DatabaseError 
  | StorageError 
  | NetworkError 
  | EdgeFunctionError;

// Operation result type that includes error handling
export interface OperationResult<T> {
  data?: T;
  error?: SupabaseErrorUnion;
  success: boolean;
}
