
import { UserRole } from "./supabase/auth";

export interface Profile {
  id: string;
  role: UserRole;
  updated_at: string;
  suspended?: boolean;
  full_name?: string;
  avatar_url?: string;
}

export interface DealerProfile {
  id: string;
  user_id: string;
  dealership_name: string;
  supervisor_name: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  verification_status: string;
  is_verified: boolean;
  license_number: string;
  created_at: string;
  updated_at: string;
}

export interface DealerDataWithProfile {
  id: string; 
  user_id: string;
  dealership_name: string;
  supervisor_name: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  verification_status: string;
  is_verified: boolean;
  license_number: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}
