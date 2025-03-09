
/**
 * Utility functions for mapping dealer profile data between form and database
 */

import { normalizeEmail, normalizePhoneNumber, normalizeIdentifier, normalizeName, normalizeAddress } from './normalizers';
import { formatTaxIdForDisplay, formatBusinessRegistryForDisplay } from './formatters';

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
  
  // Create the basic transformed profile
  const profile = {
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
  
  // Add formatted display versions of key identifiers
  return {
    ...profile,
    formattedTaxId: formatTaxIdForDisplay(profile.taxId),
    formattedBusinessRegistry: formatBusinessRegistryForDisplay(profile.businessRegistryNumber)
  };
}
