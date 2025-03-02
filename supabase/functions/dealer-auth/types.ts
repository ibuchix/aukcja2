
export interface RegisterRequest {
  email: string;
  password: string;
  metadata: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmailCheckRequest {
  email: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
