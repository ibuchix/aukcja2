import { DatabaseError, DatabaseErrorType } from './errorTypes';
import { handleSupabaseError, createDatabaseError } from './errorHandler';

/**
 * User-friendly error messages for database errors
 */
const DATABASE_ERROR_MESSAGES: Record<DatabaseErrorType, string> = {
  row_not_found: 'The requested information could not be found',
  duplicate_value: 'This information already exists in our system',
  foreign_key_violation: 'This operation would violate data relationships',
  permission_denied: 'You do not have permission to perform this action',
  query_invalid: 'The database query was invalid',
  database_connection: 'Failed to connect to the database',
  transaction_failed: 'The database operation could not be completed due to a conflict',
  validation_failed: 'The data failed validation checks',
  database_general: 'A database error occurred. Please try again'
};

/**
 * Get a user-friendly message for a database error type
 */
export function getDatabaseErrorMessage(type: DatabaseErrorType, table?: string): string {
  let message = DATABASE_ERROR_MESSAGES[type] || DATABASE_ERROR_MESSAGES.database_general;
  
  // Add table context if available
  if (table) {
    if (type === 'row_not_found') {
      message = `The requested ${formatTableName(table)} could not be found`;
    } else if (type === 'duplicate_value') {
      message = `This ${formatTableName(table)} already exists in our system`;
    }
  }
  
  return message;
}

/**
 * Format a table name for user-friendly messages
 */
function formatTableName(table: string): string {
  // Convert snake_case to space-separated
  const formatted = table.replace(/_/g, ' ');
  
  // Handle special cases
  switch (table) {
    case 'dealers':
      return 'dealer profile';
    case 'cars':
      return 'vehicle';
    case 'bids':
      return 'bid';
    case 'proxy_bids':
      return 'proxy bid';
    default:
      // Remove trailing s for singular
      return formatted.endsWith('s') ? formatted.slice(0, -1) : formatted;
  }
}

/**
 * Handle database errors from Supabase
 */
export function handleDatabaseError(error: any): DatabaseError {
  const parsedError = handleSupabaseError(error);
  
  // If it's already a database error, just return it
  if ('type' in parsedError && Object.keys(DATABASE_ERROR_MESSAGES).includes(parsedError.type)) {
    return parsedError as DatabaseError;
  }
  
  // Otherwise, transform into a database error
  const message = error?.message || 'Database error';
  const code = error?.code || 'database/error';
  
  if (message.includes('not found') || code === 'PGRST116') {
    return createDatabaseError('row_not_found', DATABASE_ERROR_MESSAGES.row_not_found, code, undefined, undefined, error);
  }
  
  if (message.includes('duplicate') || message.includes('already exists') || code === '23505') {
    return createDatabaseError('duplicate_value', DATABASE_ERROR_MESSAGES.duplicate_value, code, undefined, undefined, error);
  }
  
  if (message.includes('foreign key') || code === '23503') {
    return createDatabaseError('foreign_key_violation', DATABASE_ERROR_MESSAGES.foreign_key_violation, code, undefined, undefined, error);
  }
  
  if (message.includes('permission') || message.includes('not allowed') || code === '42501') {
    return createDatabaseError('permission_denied', DATABASE_ERROR_MESSAGES.permission_denied, code, undefined, undefined, error);
  }
  
  if (message.includes('invalid') || message.includes('syntax') || code.startsWith('42')) {
    return createDatabaseError('query_invalid', DATABASE_ERROR_MESSAGES.query_invalid, code, undefined, undefined, error);
  }
  
  if (message.includes('connect') || message.includes('timeout')) {
    return createDatabaseError('database_connection', DATABASE_ERROR_MESSAGES.database_connection, code, undefined, undefined, error);
  }
  
  if (message.includes('serialization') || message.includes('deadlock') || message.includes('conflict')) {
    return createDatabaseError('transaction_failed', DATABASE_ERROR_MESSAGES.transaction_failed, code, undefined, undefined, error);
  }
  
  if (message.includes('validation') || message.includes('constraint') || code === '23514') {
    return createDatabaseError('validation_failed', DATABASE_ERROR_MESSAGES.validation_failed, code, undefined, undefined, error);
  }
  
  return createDatabaseError('database_general', DATABASE_ERROR_MESSAGES.database_general, code, undefined, undefined, error);
}
