
export interface UserMetadata {
  name: string;
  companyName?: string;
  phoneNumber?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}

export interface RegisterRequestBody {
  action: 'register';
  email: string;
  password: string;
  metadata: UserMetadata;
}

export interface LoginRequestBody {
  action: 'login';
  email: string;
  password: string;
}

export interface CheckEmailExistsRequestBody {
  action: 'checkEmailExists';
  email: string;
}

export type RequestBody = 
  | RegisterRequestBody
  | LoginRequestBody
  | CheckEmailExistsRequestBody;

export interface RegisterResponseData {
  success: boolean;
  user?: {
    id: string;
    email: string;
    user_metadata: UserMetadata;
  };
  error?: string;
  message?: string;
}

export interface LoginResponseData {
  success: boolean;
  session?: any;
  dealer?: any;
  error?: string;
}

export interface CheckEmailExistsResponseData {
  exists: boolean;
}
