
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistrationRequest {
  email: string;
  password: string;
  supervisorName?: string;
  companyName?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
}
