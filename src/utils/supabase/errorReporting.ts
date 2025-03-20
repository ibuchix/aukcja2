
import { SupabaseErrorUnion } from './errorTypes';

/**
 * A simple logger interface that can be implemented
 * with different logging solutions
 */
export interface ErrorLogger {
  log(error: SupabaseErrorUnion, context?: Record<string, any>): void;
  warn(error: SupabaseErrorUnion, context?: Record<string, any>): void;
  error(error: SupabaseErrorUnion, context?: Record<string, any>): void;
}

/**
 * Default console-based logger
 */
class ConsoleErrorLogger implements ErrorLogger {
  log(error: SupabaseErrorUnion, context?: Record<string, any>): void {
    console.log('[INFO]', error, context || {});
  }
  
  warn(error: SupabaseErrorUnion, context?: Record<string, any>): void {
    console.warn('[WARN]', error, context || {});
  }
  
  error(error: SupabaseErrorUnion, context?: Record<string, any>): void {
    console.error('[ERROR]', error, context || {});
  }
}

// Create a default logger instance
const defaultLogger = new ConsoleErrorLogger();

/**
 * Current logger instance - can be replaced with a different implementation
 */
let currentLogger: ErrorLogger = defaultLogger;

/**
 * Set a custom logger implementation
 */
export function setErrorLogger(logger: ErrorLogger): void {
  currentLogger = logger;
}

/**
 * Reset to the default logger
 */
export function resetErrorLogger(): void {
  currentLogger = defaultLogger;
}

/**
 * Log an error with debug level
 */
export function logError(error: SupabaseErrorUnion, context?: Record<string, any>): void {
  currentLogger.log(error, context);
}

/**
 * Log an error with warning level
 */
export function warnError(error: SupabaseErrorUnion, context?: Record<string, any>): void {
  currentLogger.warn(error, context);
}

/**
 * Log an error with error level
 */
export function reportError(error: SupabaseErrorUnion, context?: Record<string, any>): void {
  currentLogger.error(error, context);
}

/**
 * Format an error for display in the UI
 */
export function formatErrorForUser(error: SupabaseErrorUnion): string {
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Log and format an error for display
 */
export function processAndLogError(error: SupabaseErrorUnion, context?: Record<string, any>): string {
  reportError(error, context);
  return formatErrorForUser(error);
}
