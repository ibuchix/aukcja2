
/**
 * Utility functions for normalizing dealer profile data
 */

/**
 * Normalizes email addresses by trimming and converting to lowercase
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Normalizes phone numbers by removing non-digit characters
 * except leading plus sign
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Preserve the leading plus sign if it exists
  if (phone.startsWith('+')) {
    return '+' + phone.substring(1).replace(/[^0-9]/g, '');
  }
  
  // Remove all non-digit characters
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Normalizes tax IDs by removing any separator characters
 */
export function normalizeTaxId(taxId: string): string {
  if (!taxId) return '';
  // Remove any non-digit characters
  return taxId.replace(/[^0-9]/g, '');
}

/**
 * Normalizes business registry numbers by removing any separator characters
 */
export function normalizeBusinessRegistry(registry: string): string {
  if (!registry) return '';
  // Remove any non-digit characters
  return registry.replace(/[^0-9]/g, '');
}

/**
 * Normalizes address by trimming and removing extra whitespace
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  // Trim and replace multiple spaces with a single space
  return address.trim().replace(/\s+/g, ' ');
}
