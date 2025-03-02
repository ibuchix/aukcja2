
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
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    user_metadata: UserMetadata;
  };
}

export interface LoginResponse {
  session: any;
  dealer: any;
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
    'session' in data &&
    'dealer' in data
  );
}
