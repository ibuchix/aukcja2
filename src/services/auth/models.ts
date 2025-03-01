
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

// Define explicitly what the user object structure should be in the RegisterResponse
export interface RegisterResponseUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

// Exactly match the API response structure from create_dealer_with_profile SQL function
export interface RegisterResponse {
  success: boolean;
  user?: RegisterResponseUser; // Make optional to handle cases where user might not be present
  error?: string;
}

export interface LoginResponse {
  session: any;
  dealer: any;
}

// Type guards for runtime validation
export function isRegisterResponse(data: any): data is RegisterResponse {
  return (
    !!data &&
    typeof data === 'object' &&
    'success' in data &&
    typeof data.success === 'boolean' &&
    // Allow optional user field
    (!('user' in data) || (
      !!data.user &&
      typeof data.user === 'object' &&
      'id' in data.user &&
      typeof data.user.id === 'string' &&
      'email' in data.user &&
      typeof data.user.email === 'string'
    ))
  );
}

export function isLoginResponse(data: any): data is LoginResponse {
  return (
    !!data &&
    typeof data === 'object' &&
    'session' in data &&
    'dealer' in data
  );
}
