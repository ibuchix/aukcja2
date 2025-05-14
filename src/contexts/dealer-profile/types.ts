
export interface DealerProfileData {
  id?: string;
  user_id?: string;
  dealership_name?: string;
  supervisor_name?: string;
  tax_id?: string;
  business_registry_number?: string;
  address?: string;
  verification_status?: string;
  is_verified?: boolean;
  license_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DealerProfileContextType {
  displayProfile: DealerProfileData | null;
  rawProfile: DealerProfileData | null;
  isLoading: boolean;
  error: string | null;
  fetchAttempted: boolean;
  profileStatus: string;
  needsRecovery: boolean;
  missingFields: string[];
  profileIsComplete: boolean;
  initiateProfileRecovery: () => void;
  refreshProfile: () => Promise<void>;
}
