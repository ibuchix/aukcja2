
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

// Updated to match the exact structure returned by the API
export interface RegisterResponse {
  message: string;
  user: { 
    id: string; 
    email: string;
  };
}

export interface LoginResponse {
  session: any;
  dealer: any;
}
