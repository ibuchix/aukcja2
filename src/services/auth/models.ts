
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

// Exactly match the API response structure from create_dealer_with_profile SQL function
export interface RegisterResponse {
  success: boolean;
  user: { 
    id: string; 
    email: string;
    user_metadata?: any;
  };
  error?: string;
}

export interface LoginResponse {
  session: any;
  dealer: any;
}
