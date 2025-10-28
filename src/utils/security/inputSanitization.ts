/**
 * Input sanitization utilities for preventing security vulnerabilities
 * Provides real-time input filtering and validation
 */

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /<\s*script/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /<\s*link/gi,
  /<\s*meta/gi
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /('|(\\'))|(;)|(\\)|(\/\*(\w|\W)*?\*\/)|(--)/gi,
  /(union\s+(all\s+)?select)|(drop\s+table)|(alter\s+table)|(create\s+table)/gi,
  /(insert\s+into)|(delete\s+from)|(update\s+.+\s+set)/gi,
  /(exec\s*\()|(sp_\w+)/gi
];

/**
 * Character whitelists for different field types
 */
export const CHARACTER_WHITELIST = {
  name: /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż\s\-']*$/,
  companyName: /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.,&'\-]*$/,
  address: /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.,-/]*$/,
  email: /^[a-zA-Z0-9._%+-@]*$/,
  phone: /^[\d\s\-+()]*$/,
  digits: /^[\d]*$/,
  password: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/
};

/**
 * Maximum length limits for each field type
 */
export const MAX_LENGTHS = {
  supervisorName: 100,
  email: 255,
  password: 72, // bcrypt limit
  companyName: 100,
  companyAddress: 200,
  phoneNumber: 20,
  taxId: 10,
  businessRegistryNumber: 14
};

/**
 * Real-time input filter function for use in onChange handlers
 */
export function filterInput(
  value: string, 
  fieldType: keyof typeof CHARACTER_WHITELIST,
  maxLength?: number
): string {
  if (!value) return '';
  
  const limit = maxLength || MAX_LENGTHS[fieldType as keyof typeof MAX_LENGTHS] || 255;
  
  // Truncate to max length first
  if (value.length > limit) {
    return value.slice(0, limit);
  }
  
  // Special handling for email field
  if (fieldType === 'email') {
    // Apply character whitelist first
    const whitelist = CHARACTER_WHITELIST[fieldType];
    if (!whitelist.test(value)) {
      return value.slice(0, -1);
    }
    
    // Additional email-specific rules
    // 1. Only one @ symbol allowed
    const atCount = (value.match(/@/g) || []).length;
    if (atCount > 1) {
      return value.slice(0, -1);
    }
    
    // 2. Cannot start with @ or .
    if (value.length === 1 && (value === '@' || value === '.')) {
      return '';
    }
    
    // 3. Cannot have consecutive dots
    if (value.includes('..')) {
      return value.slice(0, -1);
    }
    
    // 4. Cannot have @ followed immediately by .
    if (value.includes('@.')) {
      return value.slice(0, -1);
    }
    
    // 5. Cannot have . followed immediately by @
    if (value.includes('.@')) {
      return value.slice(0, -1);
    }
    
    return value;
  }
  
  // For non-email fields, use existing logic
  const whitelist = CHARACTER_WHITELIST[fieldType];
  if (whitelist && !whitelist.test(value)) {
    return value.slice(0, -1);
  }
  
  return value;
}