
// Logging utilities for dealer authentication

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Set current log level (can be overridden via environment variable)
const currentLogLevel = LOG_LEVELS.INFO;

/**
 * Log a message with context data
 */
export function logMessage(level: keyof typeof LOG_LEVELS, message: string, context: any = {}) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: sanitizeContext(context)
    };
    
    // Use console methods appropriate to the level
    switch (level) {
      case 'ERROR':
        console.error(`[dealer-auth] [${timestamp}] [ERROR] ${message}`, logEntry.context);
        break;
      case 'WARN':
        console.warn(`[dealer-auth] [${timestamp}] [WARN] ${message}`, logEntry.context);
        break;
      case 'INFO':
        console.log(`[dealer-auth] [${timestamp}] [INFO] ${message}`, logEntry.context);
        break;
      case 'DEBUG':
        console.debug(`[dealer-auth] [${timestamp}] [DEBUG] ${message}`, logEntry.context);
        break;
    }
  }
}

// Helper functions using the main logMessage function
export const logDebug = (message: string, context?: any) => logMessage('DEBUG', message, context);
export const logInfo = (message: string, context?: any) => logMessage('INFO', message, context);
export const logWarn = (message: string, context?: any) => logMessage('WARN', message, context);
export const logError = (message: string, context?: any) => logMessage('ERROR', message, context);

/**
 * Sanitize sensitive data from logs
 */
function sanitizeContext(context: any): any {
  if (!context || typeof context !== 'object') {
    return context;
  }
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...context };
  
  // List of sensitive fields to redact
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credentials'];
  
  // Redact sensitive fields
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  });
  
  return sanitized;
}
