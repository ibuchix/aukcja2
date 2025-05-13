/**
 * Utility functions for normalizing dealer profile data
 */

/**
 * Normalizes an email address for consistent format
 * - Trims whitespace
 * - Converts to lowercase
 * - Handles edge cases like null or undefined
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // Trim whitespace and convert to lowercase
  return email.trim().toLowerCase();
}

/**
 * Normalizes a phone number by removing non-digit chars except for the + prefix
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Preserve only the plus sign and digits
  let normalizedPhone = phone.trim();
  
  // Keep the + prefix if present
  const hasPlus = normalizedPhone.startsWith('+');
  
  // Remove all non-digit characters
  normalizedPhone = normalizedPhone.replace(/\D/g, '');
  
  // Add back the + if it was present
  if (hasPlus) {
    normalizedPhone = '+' + normalizedPhone;
  }
  
  return normalizedPhone;
}

/**
 * Maps database profile data to display format
 */
export function mapDatabaseToDisplay(profileData: any): any {
  if (!profileData) return null;
  
  return {
    id: profileData.id,
    displayName: profileData.dealership_name || profileData.supervisor_name || 'Dealer',
    supervisorName: profileData.supervisor_name || '',
    companyName: profileData.dealership_name || '',
    taxId: profileData.tax_id || '',
    businessRegistryNumber: profileData.business_registry_number || '',
    address: profileData.address || '',
    verificationStatus: profileData.verification_status || 'pending',
    isVerified: !!profileData.is_verified,
    createdAt: profileData.created_at ? new Date(profileData.created_at) : new Date(),
    // Add additional fields as needed
  };
}
