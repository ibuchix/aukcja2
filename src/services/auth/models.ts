
export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
  message?: string;
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

export function isRegisterResponse(obj: any): obj is RegisterResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.user &&
    typeof obj.user === 'object' &&
    typeof obj.user.id === 'string' &&
    typeof obj.user.email === 'string' &&
    obj.user.user_metadata &&
    typeof obj.user.user_metadata === 'object'
  );
}

export function isLoginResponse(data: any): data is LoginResponse {
  return (
    !!data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    (data.session !== undefined || data.dealer !== undefined || data.error !== undefined)
  );
}
