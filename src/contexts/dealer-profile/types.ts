
export interface DealerProfileData {
  id?: string;
  user_id: string;
  dealership_name: string;
  address: string;
  supervisor_name: string;
  license_number?: string;
  tax_id: string;
  business_registry_number: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  needs_recovery?: boolean;
}

export interface DealerProfileContextType {
  displayProfile: DealerProfileData | null;
  rawProfile: DealerProfileData | null;
  isLoading: boolean;
  error: string | null;
  errorType: 'permission' | 'network' | 'data' | 'auth' | 'unknown';
  fetchAttempted: boolean;
  profileStatus: string;
  needsRecovery: boolean;
  missingFields: string[];
  profileIsComplete: boolean;
  initiateProfileRecovery: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Required fields for profile completion
export const REQUIRED_PROFILE_FIELDS: string[] = [
  'dealership_name', 
  'supervisor_name', 
  'address',
  'tax_id',
  'business_registry_number'
];
