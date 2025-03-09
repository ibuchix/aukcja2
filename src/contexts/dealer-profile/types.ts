
// Profile status types
export type ProfileStatus = "loading" | "complete" | "not_found" | "incomplete" | "error";

// Context type definition
export type DealerProfileContextType = {
  displayProfile: any | null;
  rawProfile: any | null;
  isLoading: boolean;
  error: string | null;
  fetchAttempted: boolean;
  profileStatus: ProfileStatus;
  needsRecovery: boolean;
  missingFields: string[];
  profileIsComplete: boolean;
  initiateProfileRecovery: () => void;
  refreshProfile: () => Promise<void>;
};

// Required fields for a complete profile
export const REQUIRED_PROFILE_FIELDS = [
  'supervisor_name', 
  'dealership_name', 
  'tax_id', 
  'business_registry_number', 
  'address'
];
