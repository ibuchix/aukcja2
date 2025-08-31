/**
 * Security validation utilities for dealer-auth edge function
 */

import { logWarning, logSecurityEvent } from "./logging.ts";

/**
 * Validate that authentication logs don't contain sensitive information
 */
export function validateAuthLogSecurity(logData: Record<string, any>): boolean {
  const serialized = JSON.stringify(logData).toLowerCase();
  
  // Patterns that should never appear in logs
  const forbiddenPatterns = [
    // Password-related
    /password\s*[:=]\s*[^\s\]]+/,
    /pwd\s*[:=]\s*[^\s\]]+/,
    
    // Character codes (often used for password analysis)
    /"[a-z_]*code"\s*:\s*\d+/,
    /charcode|character.*code/,
    
    // Length information that could reveal password structure
    /"[a-z_]*length"\s*:\s*\d+/,
    /password.*length|length.*password/,
    
    // Tokens or hashes
    /[a-f0-9]{32,}/,
    /bearer\s+[a-za-z0-9]+/,
    
    // API keys
    /api[_-]?key\s*[:=]\s*[^\s\]]+/,
    /secret[_-]?key\s*[:=]\s*[^\s\]]+/
  ];
  
  const violations = forbiddenPatterns.filter(pattern => pattern.test(serialized));
  
  if (violations.length > 0) {
    logSecurityEvent("validation_failure", {
      event: "sensitive_data_in_logs",
      violationCount: violations.length,
      dataKeys: Object.keys(logData)
    });
    return false;
  }
  
  return true;
}

/**
 * Monitor authentication rate limiting
 */
const authAttempts = new Map<string, number[]>();

export function checkAuthRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old attempts
  const currentAttempts = authAttempts.get(identifier) || [];
  const recentAttempts = currentAttempts.filter(timestamp => timestamp > windowStart);
  
  if (recentAttempts.length >= maxAttempts) {
    logSecurityEvent("rate_limit", {
      identifier,
      attemptCount: recentAttempts.length,
      windowMs,
      blocked: true
    });
    return false;
  }
  
  // Record this attempt
  recentAttempts.push(now);
  authAttempts.set(identifier, recentAttempts);
  
  return true;
}

/**
 * Detect suspicious authentication patterns
 */
export function detectSuspiciousAuthPattern(email: string, userAgent?: string, ip?: string): boolean {
  // Check for automated tools or suspicious user agents
  const suspiciousAgents = [
    /curl/i,
    /wget/i,
    /python/i,
    /bot/i,
    /crawler/i,
    /scanner/i,
    /test/i
  ];
  
  if (userAgent && suspiciousAgents.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent("suspicious_access", {
      email,
      userAgent,
      ip,
      reason: "suspicious_user_agent"
    });
    return true;
  }
  
  return false;
}

/**
 * Create secure audit log entry for authentication events
 */
export interface SecureAuthAudit {
  timestamp: string;
  action: "login" | "register" | "password_reset";
  email: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  requestId: string;
  securityFlags?: string[];
}

export function createSecureAuthAudit(
  action: SecureAuthAudit["action"],
  email: string,
  success: boolean,
  requestId: string,
  context?: Partial<Pick<SecureAuthAudit, "ip" | "userAgent">>
): SecureAuthAudit {
  const audit: SecureAuthAudit = {
    timestamp: new Date().toISOString(),
    action,
    email: email.toLowerCase(),
    success,
    requestId,
    ip: context?.ip || "unknown",
    userAgent: context?.userAgent?.substring(0, 200) || "unknown"
  };
  
  // Add security flags if needed
  const flags: string[] = [];
  
  if (detectSuspiciousAuthPattern(email, context?.userAgent, context?.ip)) {
    flags.push("suspicious_pattern");
  }
  
  if (!checkAuthRateLimit(email)) {
    flags.push("rate_limited");
  }
  
  if (flags.length > 0) {
    audit.securityFlags = flags;
  }
  
  return audit;
}