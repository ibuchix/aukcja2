
/**
 * Defines dealer-related types used throughout the application
 */

// Dealer details from database
export interface DealerRecord {
  id: string;
  user_id: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  supervisor_name: string;
  dealership_name: string;
  tax_id: string;
  business_registry_number: string;
  license_number?: string;
  address: string;
  verification_status: 'pending' | 'approved' | 'rejected';
}

// Pending dealer for admin verification
export interface PendingDealer {
  id: string;
  dealership_name: string;
  supervisor_name: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  user_id: string;
}

// Dealer profile data with additional fields
export interface DealerProfileData {
  id?: string;
  user_id?: string;
  dealership_name?: string;
  supervisor_name?: string;
  tax_id?: string;
  business_registry_number?: string;
  address?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  is_verified?: boolean;
  license_number?: string;
  created_at?: string;
  updated_at?: string;
  profile_status?: string;
  needs_recovery?: boolean;
  [key: string]: any;
}

// Type guard for dealer records
export function isPendingDealer(item: any): item is PendingDealer {
  return (
    item !== null &&
    typeof item === 'object' &&
    'id' in item &&
    'dealership_name' in item &&
    'supervisor_name' in item &&
    'verification_status' in item
  );
}

// Type guard for dealer profile data
export function isDealerProfileData(item: any): item is DealerProfileData {
  return (
    item !== null &&
    typeof item === 'object' &&
    'user_id' in item
  );
}

// Helper function to check if dealer is verified - updated to handle both approved status and is_verified flag
export function isDealerVerified(dealer: DealerRecord | DealerProfileData | null): boolean {
  if (!dealer) return false;
  return dealer.verification_status === 'approved' || dealer.is_verified === true;
}
