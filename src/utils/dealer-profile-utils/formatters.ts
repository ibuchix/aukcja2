
/**
 * Utility functions for formatting dealer profile data for display
 */

/**
 * Formats a tax ID for display (adds spacing)
 * Example: 1234567890 -> 123-456-78-90
 */
export function formatTaxIdForDisplay(taxId: string): string {
  if (!taxId || taxId.length !== 10) return taxId || 'N/A';
  
  // Format as XXX-XXX-XX-XX
  return `${taxId.substring(0, 3)}-${taxId.substring(3, 6)}-${taxId.substring(6, 8)}-${taxId.substring(8, 10)}`;
}

/**
 * Formats a business registry number for display
 * Example: 123456789 -> 123-456-789
 */
export function formatBusinessRegistryForDisplay(regNumber: string): string {
  if (!regNumber) return 'N/A';
  
  if (regNumber.length === 9) {
    // Format as XXX-XXX-XXX
    return `${regNumber.substring(0, 3)}-${regNumber.substring(3, 6)}-${regNumber.substring(6, 9)}`;
  } else if (regNumber.length === 14) {
    // Format as XXXXX-XXXXX-XXXX
    return `${regNumber.substring(0, 5)}-${regNumber.substring(5, 10)}-${regNumber.substring(10, 14)}`;
  }
  
  return regNumber;
}

/**
 * Formats name with proper capitalization
 * Example: "john doe" -> "John Doe"
 */
export function formatNameForDisplay(name: string): string {
  if (!name) return 'N/A';
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats address for display with proper line breaks
 */
export function formatAddressForDisplay(address: string): string {
  if (!address) return 'N/A';
  
  // Remove excessive whitespace
  return address.replace(/\s+/g, ' ').trim();
}

/**
 * Provides a fallback for empty values
 */
export function getValueWithFallback(value: string | null | undefined, fallback: string = 'N/A'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
}

