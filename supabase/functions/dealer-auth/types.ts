
export interface SignUpResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation' | 'network';
  userId?: string;
  message?: string;
}

export interface UserMetadata {
  name: string;
  companyName?: string;
  phoneNumber?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}

export interface RegisterResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    user_metadata: UserMetadata;
  };
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  session?: any;
  dealer?: any;
  error?: string;
}
