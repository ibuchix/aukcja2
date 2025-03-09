/**
 * Utility functions for normalizing dealer profile data
 */

/**
 * Normalizes an email address to lowercase and trims whitespace
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalizes a phone number by removing spaces and ensuring it starts with +
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all spaces, keep only digits, +, and () characters
  const cleaned = phoneNumber.replace(/\s+/g, '');
  // Ensure it starts with +
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Normalizes identifiers like tax ID and business registry number
 * by removing all non-digit characters
 */
export function normalizeIdentifier(identifier: string): string {
  return identifier.replace(/\D/g, '');
}

/**
 * Normalizes names by trimming whitespace while preserving case
 */
export function normalizeName(name: string): string {
  return name.trim();
}

/**
 * Normalizes address by trimming whitespace
 */
export function normalizeAddress(address: string): string {
  return address.trim();
}
