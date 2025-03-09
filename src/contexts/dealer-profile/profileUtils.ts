
import { REQUIRED_PROFILE_FIELDS } from "./types";

/**
 * Check if a profile is complete based on required fields
 */
export const checkProfileCompleteness = (profileData: any): { isComplete: boolean, missing: string[] } => {
  if (!profileData) {
    return { isComplete: false, missing: ["profile_not_found"] };
  }

  // Special case for profile_status explicitly set by backend
  if (profileData.profile_status === "not_found") {
    return { isComplete: false, missing: ["profile_not_found"] };
  }
  
  if (profileData.profile_status === "incomplete") {
    // Use missing_fields if provided by the backend
    const missing = Array.isArray(profileData.missing_fields) ? profileData.missing_fields : [];
    return { isComplete: false, missing };
  }

  // For normal profiles, check required fields
  const missing = REQUIRED_PROFILE_FIELDS.filter(field => {
    const value = profileData[field];
    return value === undefined || value === null || value === '';
  });

  return { isComplete: missing.length === 0, missing };
};
