
// Define request types
export interface RegisterRequest {
  email: string;
  password: string;
  metadata?: {
    name?: string;
    companyName?: string;
    taxId?: string;
    businessRegistryNumber?: string;
    companyAddress?: string;
    phoneNumber?: string;
    role?: string;
    [key: string]: any;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmailCheckRequest {
  email: string;
}

// Response types
export interface LoginResponse {
  success: boolean;
  session?: any;
  dealer?: any;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  userId?: string;
  user?: any;
  error?: string;
  message?: string;
}

export interface EmailCheckResponse {
  exists: boolean;
}

// Type guards
export function isLoginResponse(obj: any): obj is LoginResponse {
  return (
    typeof obj === 'object' && 
    'success' in obj &&
    typeof obj.success === 'boolean'
  );
}

export function isRegisterResponse(obj: any): obj is RegisterResponse {
  return (
    typeof obj === 'object' && 
    'success' in obj &&
    typeof obj.success === 'boolean'
  );
}
