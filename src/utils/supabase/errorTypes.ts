
export type AuthErrorType = 
  | 'invalid_credentials' 
  | 'email_taken'
  | 'weak_password'
  | 'user_not_found'
  | 'session_expired'
  | 'not_authenticated'
  | 'invalid_token'
  | 'auth_general';

export type DatabaseErrorType = 
  | 'row_not_found'
  | 'duplicate_value'
  | 'foreign_key_violation'
  | 'validation_failed'
  | 'permission_denied'
  | 'query_invalid'
  | 'transaction_failed'
  | 'database_general';

export type StorageErrorType =
  | 'upload_failed'
  | 'download_failed'
  | 'delete_failed'
  | 'storage_general';

export type NetworkErrorType =
  | 'network_timeout'
  | 'network_offline'
  | 'rate_limited'
  | 'server_error'
  | 'network_general';

export type EdgeFunctionErrorType =
  | 'function_invocation_failed'
  | 'function_timeout'
  | 'edge_general';

export interface AuthError {
  type: AuthErrorType;
  code: string;
  message: string;
  originalError?: any;
}

export interface DatabaseError {
  type: DatabaseErrorType;
  code: string;
  message: string;
  table?: string;
  column?: string;
  originalError?: any;
}

export interface StorageError {
  type: StorageErrorType;
  code: string;
  message: string;
  bucket?: string;
  path?: string;
  originalError?: any;
}

export interface NetworkError {
  type: NetworkErrorType;
  code: string;
  message: string;
  status?: number;
  originalError?: any;
}

export interface EdgeFunctionError {
  type: EdgeFunctionErrorType;
  code: string;
  message: string;
  functionName?: string;
  originalError?: any;
}

export type SupabaseErrorUnion = 
  | AuthError 
  | DatabaseError 
  | StorageError 
  | NetworkError 
  | EdgeFunctionError;

export interface OperationResult<T> {
  data?: T;
  error?: SupabaseErrorUnion;
  success: boolean;
}
