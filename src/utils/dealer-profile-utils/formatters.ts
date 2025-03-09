
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
 * Formats a phone number for display
 * Adds spacing between groups of digits
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  if (!phoneNumber) return 'N/A';
  
  // Normalize by removing non-digit characters except the leading +
  let normalized = phoneNumber.startsWith('+') 
    ? '+' + phoneNumber.substring(1).replace(/\D/g, '')
    : phoneNumber.replace(/\D/g, '');
  
  // Add proper spacing based on common formats
  if (normalized.startsWith('+')) {
    // International format: +XX XXX XXX XXXX
    if (normalized.length > 3) {
      const countryCode = normalized.substring(0, 3);
      const rest = normalized.substring(3);
      
      // Format the rest in groups of 3-3-4 or other patterns depending on length
      let formatted = countryCode;
      for (let i = 0; i < rest.length; i += 3) {
        formatted += ' ' + rest.substring(i, Math.min(i + 3, rest.length));
      }
      return formatted.trim();
    }
  } else if (normalized.length === 10) {
    // US format: XXX-XXX-XXXX
    return `${normalized.substring(0, 3)}-${normalized.substring(3, 6)}-${normalized.substring(6, 10)}`;
  }
  
  // If no specific format matches, return as is
  return phoneNumber;
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
