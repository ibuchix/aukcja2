/**
 * Utility functions for mapping dealer profile data between form and database
 * This ensures consistency in how data is transformed throughout the application
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

/**
 * Form field to database column mapping
 * Maps the registration form field names to database column names
 */
export const formToDatabaseMapping = {
  supervisorName: 'supervisor_name',
  companyName: 'dealership_name',
  taxId: 'tax_id',
  businessRegistryNumber: 'business_registry_number',
  companyAddress: 'address',
  phoneNumber: 'phone_number', // Stored in user metadata
  email: 'email', // Stored in auth.users
  // Fields below are not directly entered in the form but set automatically
  licenseNumber: 'license_number',
  verificationStatus: 'verification_status',
  isVerified: 'is_verified',
};

/**
 * Maps form values to database structure, applying appropriate normalizations
 */
export function mapFormToDatabase(formValues: any) {
  return {
    supervisor_name: normalizeName(formValues.supervisorName),
    dealership_name: normalizeName(formValues.companyName),
    tax_id: normalizeIdentifier(formValues.taxId),
    business_registry_number: normalizeIdentifier(formValues.businessRegistryNumber),
    address: normalizeAddress(formValues.companyAddress),
    // These fields are set automatically during registration
    license_number: normalizeIdentifier(formValues.businessRegistryNumber), // Currently duplicates business registry
    verification_status: 'pending',
    is_verified: false,
    // User fields (not directly in dealers table)
    email: normalizeEmail(formValues.email),
    phone_number: normalizePhoneNumber(formValues.phoneNumber || ''),
  };
}

/**
 * Maps database dealer profile to displayable format
 * Can be used in components that display dealer information
 */
export function mapDatabaseToDisplay(dbProfile: any) {
  if (!dbProfile) return null;
  
  return {
    supervisorName: dbProfile.supervisor_name || '',
    dealershipName: dbProfile.dealership_name || '',
    taxId: dbProfile.tax_id || '',
    businessRegistryNumber: dbProfile.business_registry_number || '',
    address: dbProfile.address || '',
    licenseNumber: dbProfile.license_number || '',
    verificationStatus: dbProfile.verification_status || 'pending',
    isVerified: dbProfile.is_verified || false,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

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
