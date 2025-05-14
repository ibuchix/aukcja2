
import { DealerProfileData } from '@/types/dealer';
import { isValidRecord } from '@/utils/supabaseHelpers';

// Required fields for a complete dealer profile
export const REQUIRED_PROFILE_FIELDS = [
  'user_id',
  'dealership_name',
  'supervisor_name',
  'tax_id',
  'business_registry_number',
  'address'
];

/**
 * Checks if a dealer profile has all required fields
 */
export function checkProfileCompleteness(profile: DealerProfileData | null): { isComplete: boolean; missing: string[] } {
  // Default response for empty profile
  if (!profile) {
    return { isComplete: false, missing: [...REQUIRED_PROFILE_FIELDS] };
  }

  // Ensure we're working with a valid record
  if (!isValidRecord(profile)) {
    return { isComplete: false, missing: [...REQUIRED_PROFILE_FIELDS] };
  }
  
  // Check for missing required fields
  const missing = REQUIRED_PROFILE_FIELDS.filter(field => {
    const value = profile[field as keyof DealerProfileData];
    return value === null || value === undefined || value === '';
  });
  
  return {
    isComplete: missing.length === 0,
    missing
  };
}

/**
 * Checks if a dealer profile needs recovery
 */
export function checkProfileNeedsRecovery(profile: DealerProfileData | null): boolean {
  if (!profile) return true;
  
  // Check if the profile exists but is incomplete
  const { isComplete } = checkProfileCompleteness(profile);
  return !isComplete;
}

/**
 * Gets profile status based on profile data and completeness
 */
export function getProfileStatus(profileData: DealerProfileData | null): string {
  if (!profileData) return 'not_found';
  
  const { isComplete } = checkProfileCompleteness(profileData);
  if (!isComplete) return 'incomplete';
  
  return profileData.verification_status || 'pending';
}

/**
 * Gets profile completion status with percentage and missing fields
 */
export function getProfileCompletionStatus(profile: DealerProfileData | null): {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
} {
  if (!profile) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: [...REQUIRED_PROFILE_FIELDS]
    };
  }

  const { isComplete, missing } = checkProfileCompleteness(profile);
  const totalFields = REQUIRED_PROFILE_FIELDS.length;
  const completedFields = totalFields - missing.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  return {
    isComplete,
    completionPercentage,
    missingFields: missing
  };
}
