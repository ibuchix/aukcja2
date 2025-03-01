
export interface Database {
  public: {
    Tables: {
      dealers: {
        Row: {
          id: string;
          user_id: string;
          supervisor_name: string;
          dealership_name: string | null;
          tax_id: string | null;
          business_registry_number: string | null;
          address: string | null;
          verification_status: string;
          is_verified: boolean;
          license_number: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          role: string;
          full_name: string | null;
          updated_at: string | null;
        };
      };
    };
  };
}

export interface AuthHandlerResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
  dealer?: any;
  session?: any;
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

export type DealerAuthRequest = LoginRequest | RegisterRequest;
