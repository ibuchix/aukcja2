
/**
 * Helper functions for formatting and mapping dealer profile data
 */

import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { normalizePhoneNumber, normalizeEmail } from "./normalizers";

/**
 * Maps form values to database-ready structure 
 */
export function mapFormToDatabase(values: DealerFormValues): Record<string, any> {
  return {
    supervisor_name: values.supervisorName.trim(),
    dealership_name: values.companyName.trim(),
    tax_id: values.taxId.trim(),
    business_registry_number: values.businessRegistryNumber.trim(),
    address: values.companyAddress.trim(),
    email: normalizeEmail(values.email),
    phone_number: values.phoneNumber ? normalizePhoneNumber(values.phoneNumber) : null
  };
}

/**
 * Format tax ID for display (e.g. 1234567890 -> 123-456-78-90)
 */
export function formatTaxIdForDisplay(taxId: string): string {
  if (!taxId || taxId.length !== 10) return taxId;
  return `${taxId.slice(0, 3)}-${taxId.slice(3, 6)}-${taxId.slice(6, 8)}-${taxId.slice(8, 10)}`;
}

/**
 * Format business registry number for display
 */
export function formatBusinessRegistryForDisplay(regNumber: string): string {
  if (!regNumber) return regNumber;
  
  // Format 9-digit REGON
  if (regNumber.length === 9) {
    return `${regNumber.slice(0, 2)}-${regNumber.slice(2, 5)}-${regNumber.slice(5, 9)}`;
  }
  
  // Format 14-digit REGON
  if (regNumber.length === 14) {
    return `${regNumber.slice(0, 2)}-${regNumber.slice(2, 5)}-${regNumber.slice(5, 8)}-${regNumber.slice(8, 11)}-${regNumber.slice(11, 14)}`;
  }
  
  return regNumber;
}

/**
 * Format name for display with proper capitalization
 */
export function formatNameForDisplay(name?: string): string {
  if (!name) return "Not available";
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get value with fallback for potentially undefined values
 */
export function getValueWithFallback(value?: string | null, fallback = "Not available"): string {
  return value || fallback;
}

