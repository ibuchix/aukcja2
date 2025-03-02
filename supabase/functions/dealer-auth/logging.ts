
/**
 * Improved logging utilities for dealer-auth edge function
 */

// Log levels
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

// Create a formatted timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// Safely stringify an object for logging
function safeStringify(obj: any): string {
  try {
    // Handle circular references and big objects
    return JSON.stringify(obj, (key, value) => {
      if (key === "password" || key.includes("password")) {
        return "[REDACTED]";
      }
      
      // Limit strings to 1000 chars
      if (typeof value === "string" && value.length > 1000) {
        return value.substring(0, 997) + "...";
      }
      
      // Prevent circular references
      if (typeof value === "object" && value !== null) {
        if (seenObjects.has(value)) {
          return "[Circular]";
        }
        seenObjects.add(value);
      }
      
      return value;
    }, 2);
  } catch (error) {
    return `[Error serializing object: ${error.message}]`;
  } finally {
    seenObjects.clear();
  }
}

// Set for tracking circular references
const seenObjects = new Set();

// Base log function
function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = getTimestamp();
  const logData = data !== undefined ? `, data: ${safeStringify(data)}` : "";
  console.log(`[dealer-auth] [${timestamp}] [${level}] ${message}${logData}`);
}

/**
 * Log a debug message
 */
export function logDebug(message: string, data?: any): void {
  log(LogLevel.DEBUG, message, data);
}

/**
 * Log an info message
 */
export function logInfo(message: string, data?: any): void {
  log(LogLevel.INFO, message, data);
}

/**
 * Log a warning message
 */
export function logWarning(message: string, data?: any): void {
  log(LogLevel.WARNING, message, data);
}

/**
 * Log an error message
 */
export function logError(message: string, error?: any): void {
  log(LogLevel.ERROR, message, error);
}

/**
 * Log an incoming request
 */
export function logRequest(req: Request): void {
  const url = new URL(req.url);
  logInfo(`Received ${req.method} request to ${url.pathname}`, {
    headers: Object.fromEntries(req.headers),
    query: Object.fromEntries(url.searchParams),
  });
}
