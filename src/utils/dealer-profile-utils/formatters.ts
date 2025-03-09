
/**
 * Utility functions for formatting dealer profile data for display
 */

/**
 * Formats a tax ID for display (adds spacing)
 * Example: 1234567890 -> 123-456-78-90
 */
export function formatTaxIdForDisplay(taxId: string): string {
  if (!taxId || taxId.length !== 10) return taxId;
  
  // Format as XXX-XXX-XX-XX
  return `${taxId.substring(0, 3)}-${taxId.substring(3, 6)}-${taxId.substring(6, 8)}-${taxId.substring(8, 10)}`;
}

/**
 * Formats a business registry number for display
 * Example: 123456789 -> 123-456-789
 */
export function formatBusinessRegistryForDisplay(regNumber: string): string {
  if (!regNumber) return regNumber;
  
  if (regNumber.length === 9) {
    // Format as XXX-XXX-XXX
    return `${regNumber.substring(0, 3)}-${regNumber.substring(3, 6)}-${regNumber.substring(6, 9)}`;
  } else if (regNumber.length === 14) {
    // Format as XXXXX-XXXXX-XXXX
    return `${regNumber.substring(0, 5)}-${regNumber.substring(5, 10)}-${regNumber.substring(10, 14)}`;
  }
  
  return regNumber;
}
