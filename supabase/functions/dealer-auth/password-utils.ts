/**
 * Consistently prepare passwords for authentication
 * to ensure exact same transformation is used for registration and login
 */
export function preparePassword(password: string): string {
  if (!password) return '';
  
  // Simply trim leading and trailing whitespace
  // This matches the behavior in src/utils/auth-utils.ts
  return password.trim();
  
  // Note: We intentionally keep this simple to match existing client-side behavior
  // Any changes here MUST be synchronized with src/utils/auth-utils.ts
}

/**
 * Verify if a password meets minimum requirements
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  return { isValid: true };
}
