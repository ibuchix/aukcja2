
export interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation' | 'network';
  message?: string;
  userId?: string;
  partialSuccess?: boolean;
  warning?: string;
  needs_recovery?: boolean;
}

export interface SignupOptions {
  networkRetryCount?: number;
  authRetryCount?: number;
}
