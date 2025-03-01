
export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export interface SignInResult {
  success: boolean;
  error?: string;
  session?: any;
  dealer?: any;
}

export interface UserMetadata {
  name: string;
  companyName?: string;
  phoneNumber?: string;
  companyAddress?: string;
  taxId?: string;
  businessRegistryNumber?: string;
}

// Exactly match the API response structure
export interface RegisterResponse {
  message?: string;
  user: { 
    id: string; 
    email: string;
  };
  success?: boolean;
  error?: string;
}

export interface LoginResponse {
  session: any;
  dealer: any;
}
