
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

// Maximum length limits
const MAX_LENGTHS = {
  name: 100,
  companyName: 100,
  companyAddress: 200,
  phoneNumber: 20,
  taxId: 10,
  businessRegistryNumber: 14,
  email: 255
};

/**
 * Sanitize and validate registration metadata with security checks
 */
export function sanitizeMetadata(metadata: any): any {
  return {
    name: sanitizeString(metadata.name, 'name'),
    companyName: sanitizeString(metadata.companyName, 'companyName'),
    taxId: sanitizeString(metadata.taxId, 'taxId'),
    businessRegistryNumber: sanitizeString(metadata.businessRegistryNumber, 'businessRegistryNumber'),
    companyAddress: sanitizeString(metadata.companyAddress, 'companyAddress'),
    phoneNumber: sanitizeString(metadata.phoneNumber, 'phoneNumber')
  };
}

/**
 * Enhanced string sanitization with security checks and length limits
 */
export function sanitizeString(value: any, fieldType: keyof typeof MAX_LENGTHS = 'name'): string {
  if (typeof value !== "string") return "";
  
  let sanitized = value.trim();
  
  // Apply length limit
  const maxLength = MAX_LENGTHS[fieldType];
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  
  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove SQL injection patterns
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Normalize whitespace for addresses
  if (fieldType === 'companyAddress') {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }
  
  // Remove non-digits for numeric fields
  if (fieldType === 'taxId' || fieldType === 'businessRegistryNumber') {
    sanitized = sanitized.replace(/[^0-9]/g, '');
  }
  
  // Remove non-phone characters for phone numbers
  if (fieldType === 'phoneNumber') {
    if (sanitized.startsWith('+')) {
      sanitized = '+' + sanitized.substring(1).replace(/[^0-9]/g, '');
    } else {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    }
  }
  
  return sanitized;
}

/**
 * Validates that input doesn't contain dangerous patterns
 */
export function isInputSafe(value: string): boolean {
  if (!value) return true;
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) return false;
  }
  
  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) return false;
  }
  
  return true;
}
