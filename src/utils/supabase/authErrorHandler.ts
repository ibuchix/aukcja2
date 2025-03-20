import { AuthError, AuthErrorType } from './errorTypes';
import { handleSupabaseError, createAuthError } from './errorHandler';

/**
 * User-friendly error messages for authentication errors
 */
const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  invalid_credentials: 'The email or password you entered is incorrect',
  email_taken: 'This email address is already registered',
  weak_password: 'Your password is too weak. It should be at least 8 characters long and include mixed case, numbers, and symbols',
  user_not_found: 'Account not found. Please check your email or sign up for a new account',
  session_expired: 'Your session has expired. Please sign in again',
  not_authenticated: 'You need to be signed in to perform this action',
  invalid_token: 'Your authentication token is invalid or has expired',
  auth_general: 'An authentication error occurred. Please try again'
};

/**
 * Get a user-friendly message for an auth error type
 */
export function getAuthErrorMessage(type: AuthErrorType): string {
  return AUTH_ERROR_MESSAGES[type] || AUTH_ERROR_MESSAGES.auth_general;
}

/**
 * Handle authentication errors from Supabase
 */
export function handleAuthError(error: any): AuthError {
  const parsedError = handleSupabaseError(error);
  
  // If it's already an auth error, just return it
  if ('type' in parsedError && Object.keys(AUTH_ERROR_MESSAGES).includes(parsedError.type)) {
    return parsedError as AuthError;
  }
  
  // Otherwise, transform into an auth error
  const message = error?.message || 'Authentication error';
  
  if (message.includes('email already exists') || message.includes('already registered')) {
    return createAuthError('email_taken', getAuthErrorMessage('email_taken'), error?.code, error);
  }
  
  if (message.includes('invalid login') || message.includes('Invalid login') || message.includes('incorrect password')) {
    return createAuthError('invalid_credentials', getAuthErrorMessage('invalid_credentials'), error?.code, error);
  }
  
  if (message.includes('user not found') || message.includes('User not found')) {
    return createAuthError('user_not_found', getAuthErrorMessage('user_not_found'), error?.code, error);
  }
  
  if (message.includes('expired') || message.includes('Expired')) {
    return createAuthError('session_expired', getAuthErrorMessage('session_expired'), error?.code, error);
  }
  
  if (message.includes('authenticated') || message.includes('Authenticated') || message.includes('sign in')) {
    return createAuthError('not_authenticated', getAuthErrorMessage('not_authenticated'), error?.code, error);
  }
  
  if (message.includes('password') && (message.includes('requirements') || message.includes('weak'))) {
    return createAuthError('weak_password', getAuthErrorMessage('weak_password'), error?.code, error);
  }
  
  return createAuthError('auth_general', getAuthErrorMessage('auth_general'), error?.code, error);
}
