
// Type definitions for dealer authentication

// Registration request payload
export interface RegisterRequest {
  email: string;
  password: string;
  metadata: UserMetadata;
  action: 'register';
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
  action: 'login';
}

// Email check request
export interface EmailCheckRequest {
  email: string;
  action: 'check-email-exists';
}

// User metadata structure
export interface UserMetadata {
  name: string;
  companyName?: string;
  phoneNumber?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}

// Registration response
export interface RegisterResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    user_metadata: UserMetadata;
  };
  error?: string;
  message?: string;
}

// Login response
export interface LoginResponse {
  success: boolean;
  session?: any;
  dealer?: any;
  error?: string;
}

// Email check response
export interface EmailCheckResponse {
  exists: boolean;
}

// Generic dealer auth request
export type DealerAuthRequest = RegisterRequest | LoginRequest | EmailCheckRequest;

// Type guard for RegisterRequest
export function isRegisterRequest(req: any): req is RegisterRequest {
  return req && req.action === 'register' && typeof req.email === 'string' && typeof req.password === 'string';
}

// Type guard for LoginRequest
export function isLoginRequest(req: any): req is LoginRequest {
  return req && req.action === 'login' && typeof req.email === 'string' && typeof req.password === 'string';
}

// Type guard for EmailCheckRequest
export function isEmailCheckRequest(req: any): req is EmailCheckRequest {
  return req && req.action === 'check-email-exists' && typeof req.email === 'string';
}
