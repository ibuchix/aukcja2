
import { DealerProfileData } from "@/types/dealer";

/**
 * Maps database-style snake_case properties to camelCase for UI consumption
 */
export function mapProfileToCamelCase(profile: DealerProfileData | null): any {
  if (!profile) return null;
  
  return {
    id: profile.id,
    userId: profile.user_id,
    dealershipName: profile.dealership_name,
    supervisorName: profile.supervisor_name,
    taxId: profile.tax_id,
    businessRegistryNumber: profile.business_registry_number,
    address: profile.address,
    verificationStatus: profile.verification_status,
    isVerified: profile.is_verified,
    licenseNumber: profile.license_number,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    // Include any additional properties that might be needed
    // Pass through any other properties
    ...profile
  };
}

/**
 * Maps camelCase UI properties back to snake_case for database storage
 */
export function mapProfileToSnakeCase(profile: any): Partial<DealerProfileData> {
  if (!profile) return {};
  
  const result: Partial<DealerProfileData> = {};
  
  // Map camelCase to snake_case
  if (profile.dealershipName !== undefined) result.dealership_name = profile.dealershipName;
  if (profile.supervisorName !== undefined) result.supervisor_name = profile.supervisorName;
  if (profile.taxId !== undefined) result.tax_id = profile.taxId;
  if (profile.businessRegistryNumber !== undefined) result.business_registry_number = profile.businessRegistryNumber;
  if (profile.licenseNumber !== undefined) result.license_number = profile.licenseNumber;
  if (profile.isVerified !== undefined) result.is_verified = profile.isVerified;
  if (profile.verificationStatus !== undefined) result.verification_status = profile.verificationStatus;
  if (profile.userId !== undefined) result.user_id = profile.userId;
  
  // Handle any direct snake_case properties
  const snakeCaseProps = [
    'id', 'user_id', 'dealership_name', 'supervisor_name', 'tax_id', 
    'business_registry_number', 'address', 'verification_status', 
    'is_verified', 'license_number', 'created_at', 'updated_at'
  ];
  
  snakeCaseProps.forEach(prop => {
    if (profile[prop] !== undefined) {
      result[prop as keyof DealerProfileData] = profile[prop];
    }
  });
  
  return result;
}
