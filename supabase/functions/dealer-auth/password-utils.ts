
/**
 * Consistently clean and prepare passwords for authentication
 * Prevents issues with whitespace and other common problems
 * IMPORTANT: This MUST match the logic in the client's auth-utils.ts
 */
export function preparePassword(password: string): string {
  if (!password) return '';
  // Trim whitespace but preserve internal spaces
  return password.trim();
}
