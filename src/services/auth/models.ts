
export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
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
