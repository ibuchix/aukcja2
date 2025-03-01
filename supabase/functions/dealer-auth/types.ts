
// Common base interface for all dealer auth requests
export interface DealerAuthRequest {
  action: string;
  [key: string]: any;
}

// Registration specific data
export interface DealerRegistrationData extends DealerAuthRequest {
  email: string;
  password: string;
  supervisorName: string;
  companyName?: string;
  phoneNumber?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}

// Login specific data
export interface LoginData extends DealerAuthRequest {
  email: string;
  password: string;
}

// Check email exists specific data
export interface CheckEmailData extends DealerAuthRequest {
  email: string;
}

// User data returned from Supabase
export interface UserData {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

// Response formats
export interface RegisterResponse {
  user?: UserData;
  session?: any;
}

export interface LoginResponse {
  user: UserData;
  session: any;
}

export interface CheckEmailResponse {
  exists: boolean;
}
