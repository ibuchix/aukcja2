// User profile types
export interface Profile {
  id: string;
  role: string;
  profile_status?: string;
  needs_recovery?: boolean;
  updated_at: string;
  suspended: boolean;
  full_name?: string;
  avatar_url?: string;
  supervisor_name?: string;
}

export interface DealerProfileData {
  id?: string;
  user_id: string;
  dealership_name: string;
  address: string;
  supervisor_name: string;
  license_number?: string;
  tax_id: string;
  business_registry_number: string;
  verification_status?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RegistrationData {
  userId: string;
  dealershipName: string;
  address: string;
  supervisorName: string;
  licenseNumber?: string;
  taxId: string;
  businessRegistryNumber: string;
}

export interface CompleteRegistrationOptions {
  notifyAdmin?: boolean;
  onSuccess?: () => void;
}

export interface OperationResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}
