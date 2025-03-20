
import { 
  AuthError, 
  DatabaseError,
  StorageError,
  NetworkError,
  EdgeFunctionError,
  SupabaseErrorUnion,
  OperationResult
} from './errorTypes';

/**
 * Parse Supabase error code into standardized type
 */
export function parseErrorCode(code: string | undefined): {
  category: 'auth' | 'database' | 'storage' | 'network' | 'edge' | 'unknown';
  type: string;
} {
  if (!code) return { category: 'unknown', type: 'unknown' };

  // Authentication errors
  if (code === '401' || code === 'PGRST301') return { category: 'auth', type: 'not_authenticated' };
  if (code === '403' || code === 'PGRST302') return { category: 'auth', type: 'permission_denied' };
  if (code === '23505' && code.includes('auth')) return { category: 'auth', type: 'email_taken' };
  
  // Database errors
  if (code === 'PGRST116') return { category: 'database', type: 'row_not_found' };
  if (code === '23505') return { category: 'database', type: 'duplicate_value' };
  if (code === '23503') return { category: 'database', type: 'foreign_key_violation' };
  if (code === '23514') return { category: 'database', type: 'validation_failed' };
  if (code === '42501') return { category: 'database', type: 'permission_denied' };
  if (code.startsWith('42')) return { category: 'database', type: 'query_invalid' };
  if (code === 'SERIALIZATION_FAILURE' || code === 'LOCK_TIMEOUT' || code === 'DEADLOCK') {
    return { category: 'database', type: 'transaction_failed' };
  }

  // Network errors
  if (code === '429') return { category: 'network', type: 'rate_limited' };
  if (code.startsWith('5')) return { category: 'network', type: 'server_error' };
  
  // Fallback
  if (code.includes('auth')) return { category: 'auth', type: 'auth_general' };
  if (code.includes('storage')) return { category: 'storage', type: 'storage_general' };
  if (code.includes('edge') || code.includes('function')) return { category: 'edge', type: 'edge_general' };
  if (code.includes('database') || code.includes('db') || code.includes('pg')) return { category: 'database', type: 'database_general' };
  
  return { category: 'unknown', type: 'unknown' };
}

/**
 * Extract detailed information from error message and details
 */
function extractErrorDetails(error: any): {
  table?: string;
  column?: string;
  bucket?: string;
  path?: string;
  functionName?: string;
} {
  const details: any = {};
  const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
  
  // Extract table name
  const tableMatch = errorStr.match(/table\s+"([^"]+)"/i);
  if (tableMatch) details.table = tableMatch[1];
  
  // Extract column name
  const columnMatch = errorStr.match(/column\s+"([^"]+)"/i);
  if (columnMatch) details.column = columnMatch[1];
  
  // Extract bucket name
  const bucketMatch = errorStr.match(/bucket\s+"([^"]+)"/i);
  if (bucketMatch) details.bucket = bucketMatch[1];
  
  // Extract path
  const pathMatch = errorStr.match(/path\s+"([^"]+)"/i);
  if (pathMatch) details.path = pathMatch[1];
  
  // Extract function name
  const functionMatch = errorStr.match(/function\s+"([^"]+)"/i);
  if (functionMatch) details.functionName = functionMatch[1];
  
  return details;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || '';
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('internet') ||
    message.includes('timeout') ||
    message.includes('failed to fetch')
  );
}

/**
 * Create standardized auth error
 */
export function createAuthError(
  type: AuthError['type'],
  message: string,
  code: string = 'auth/error',
  originalError?: any
): AuthError {
  return {
    type,
    code,
    message,
    originalError
  };
}

/**
 * Create standardized database error
 */
export function createDatabaseError(
  type: DatabaseError['type'],
  message: string,
  code: string = 'database/error',
  table?: string,
  column?: string,
  originalError?: any
): DatabaseError {
  return {
    type,
    code,
    message,
    table,
    column,
    originalError
  };
}

/**
 * Create standardized storage error
 */
export function createStorageError(
  type: StorageError['type'],
  message: string,
  code: string = 'storage/error',
  bucket?: string,
  path?: string,
  originalError?: any
): StorageError {
  return {
    type,
    code,
    message,
    bucket,
    path,
    originalError
  };
}

/**
 * Create standardized network error
 */
export function createNetworkError(
  type: NetworkError['type'],
  message: string,
  code: string = 'network/error',
  status?: number,
  originalError?: any
): NetworkError {
  return {
    type,
    code,
    message,
    status,
    originalError
  };
}

/**
 * Create standardized edge function error
 */
export function createEdgeFunctionError(
  type: EdgeFunctionError['type'],
  message: string,
  code: string = 'edge/error',
  functionName?: string,
  originalError?: any
): EdgeFunctionError {
  return {
    type,
    code,
    message,
    functionName,
    originalError
  };
}

/**
 * Main error handler function to process Supabase errors
 */
export function handleSupabaseError(error: any): SupabaseErrorUnion {
  if (!error) {
    return createDatabaseError(
      'database_general',
      'An unknown error occurred',
      'unknown/error'
    );
  }

  console.error('Supabase error:', error);

  // Handle network errors
  if (isNetworkError(error)) {
    return createNetworkError(
      'network_general',
      error.message || 'Network error occurred',
      error.code || 'network/error',
      error.status,
      error
    );
  }

  // Parse the error code to determine category
  let errorCode = error.code || (error.error?.code) || '';
  if (!errorCode && error.message?.includes('code')) {
    const codeMatch = error.message.match(/code[:\s]+["']?([^"',\s]+)/i);
    if (codeMatch) errorCode = codeMatch[1];
  }

  const { category, type } = parseErrorCode(errorCode);
  const details = extractErrorDetails(error);
  const message = error.message || error.error?.message || 'An error occurred';

  // Create appropriate error type based on category
  switch (category) {
    case 'auth':
      return createAuthError(
        type as AuthError['type'],
        message,
        errorCode,
        error
      );
      
    case 'database':
      return createDatabaseError(
        type as DatabaseError['type'],
        message,
        errorCode,
        details.table,
        details.column,
        error
      );
      
    case 'storage':
      return createStorageError(
        type as StorageError['type'],
        message,
        errorCode,
        details.bucket,
        details.path,
        error
      );
      
    case 'edge':
      return createEdgeFunctionError(
        type as EdgeFunctionError['type'],
        message,
        errorCode,
        details.functionName,
        error
      );
      
    case 'network':
      return createNetworkError(
        type as NetworkError['type'],
        message,
        errorCode,
        error.status,
        error
      );
      
    default:
      return createDatabaseError(
        'database_general',
        message,
        errorCode || 'unknown/error',
        undefined,
        undefined,
        error
      );
  }
}

/**
 * Create a successful operation result
 */
export function createSuccessResult<T>(data: T): OperationResult<T> {
  return {
    data,
    success: true
  };
}

/**
 * Create a failed operation result
 */
export function createErrorResult<T>(error: SupabaseErrorUnion): OperationResult<T> {
  return {
    error,
    success: false
  };
}

/**
 * Wrap a Supabase operation with standardized error handling
 */
export async function wrapSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<OperationResult<T>> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      return createErrorResult<T>(handleSupabaseError(error));
    }
    
    return createSuccessResult<T>(data as T);
  } catch (error) {
    return createErrorResult<T>(handleSupabaseError(error));
  }
}
