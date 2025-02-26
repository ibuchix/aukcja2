
export interface Database {
  public: {
    Tables: {
      dealers: {
        Row: {
          id: string
          user_id: string
          supervisor_name: string
          dealership_name: string | null
          tax_id: string | null
          business_registry_number: string | null
          verification_status: string
          is_verified: boolean
          license_number: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string
          updated_at: string
        }
      }
    }
  }
}

export interface AuthHandlerResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
  session?: {
    access_token: string;
    expires_at: number;
  };
  dealer?: {
    id: string;
    dealership_name: string;
    verification_status: string;
    is_verified: boolean;
  };
  requiresVerification?: boolean;
}

export interface LoginRequest {
  action: 'login';
  email: string;
  password: string;
}

export interface RegisterRequest {
  action: 'register';
  email: string;
  password: string;
  supervisorName: string;
  companyName?: string;
  phoneNumber?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}
