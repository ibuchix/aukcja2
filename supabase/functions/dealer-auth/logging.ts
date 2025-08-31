
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

// Comprehensive list of sensitive field patterns to redact
const SENSITIVE_FIELD_PATTERNS = [
  // Password-related fields
  /password/i,
  /passwd/i,
  /pwd/i,
  /secret/i,
  /key$/i,
  /token/i,
  /auth/i,
  /credential/i,
  
  // Personal information
  /ssn/i,
  /social/i,
  /tax.*id/i,
  /license/i,
  
  // Character codes and length patterns (security-sensitive)
  /char.*code/i,
  /length/i,
  /size/i,
  
  // API keys and tokens
  /api.*key/i,
  /access.*token/i,
  /refresh.*token/i,
  /bearer/i
];

// Check if a field name matches sensitive patterns
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

// Safely stringify an object for logging with comprehensive redaction
function safeStringify(obj: any): string {
  try {
    // Handle circular references and big objects
    return JSON.stringify(obj, (key, value) => {
      // Redact sensitive fields by pattern matching
      if (isSensitiveField(key)) {
        return "[REDACTED]";
      }
      
      // Redact specific problematic values
      if (typeof value === "number" && key.toLowerCase().includes("code")) {
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
 * Log an incoming request with secure header filtering
 */
export function logRequest(req: Request): void {
  const url = new URL(req.url);
  const secureHeaders = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => 
      !isSensitiveField(key)
    )
  );
  
  logInfo(`Received ${req.method} request to ${url.pathname}`, {
    headers: secureHeaders,
    query: Object.fromEntries(url.searchParams),
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent')?.substring(0, 100) || 'unknown'
  });
}

/**
 * Log authentication attempt with secure audit trail
 */
export function logAuthAttempt(
  action: "login" | "register" | "logout",
  email: string,
  success: boolean,
  context?: Record<string, any>
): void {
  const auditData = {
    action,
    email: email?.toLowerCase(),
    success,
    timestamp: new Date().toISOString(),
    ip: context?.ip || 'unknown',
    userAgent: context?.userAgent?.substring(0, 100) || 'unknown',
    requestId: context?.requestId || 'unknown'
  };
  
  logInfo(`Auth ${action} ${success ? 'succeeded' : 'failed'} for user`, auditData);
}

/**
 * Log security event for monitoring
 */
export function logSecurityEvent(
  eventType: "suspicious_access" | "rate_limit" | "validation_failure" | "unauthorized_attempt",
  details: Record<string, any>
): void {
  const securityData = {
    eventType,
    timestamp: new Date().toISOString(),
    severity: eventType === "unauthorized_attempt" ? "HIGH" : "MEDIUM",
    ...details
  };
  
  logWarning(`Security event detected: ${eventType}`, securityData);
}

/**
 * Validate that no sensitive data appears in log message
 */
export function validateLogSecurity(message: string, data?: any): boolean {
  const combinedText = `${message} ${JSON.stringify(data || {})}`.toLowerCase();
  
  // Check for password patterns
  const dangerousPatterns = [
    /password[\s]*[:=][\s]*[^\s]+/i,
    /\d{4,}/g, // Potential character codes
    /[a-f0-9]{32,}/i // Potential hashes or tokens
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(combinedText));
}
