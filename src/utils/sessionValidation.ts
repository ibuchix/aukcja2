
import { rawSupabaseClient } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export interface SessionValidationResult {
  isValid: boolean;
  session: Session | null;
  error?: string;
  reason?: 'no_session' | 'expired' | 'invalid_token' | 'network_error';
}

/**
 * Validates the current session comprehensively
 */
export async function validateCurrentSession(): Promise<SessionValidationResult> {
  try {
    const { data, error } = await rawSupabaseClient.auth.getSession();
    
    if (error) {
      console.warn('Session validation error:', error.message);
      return {
        isValid: false,
        session: null,
        error: error.message,
        reason: 'network_error'
      };
    }

    if (!data.session) {
      return {
        isValid: false,
        session: null,
        reason: 'no_session'
      };
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (data.session.expires_at && data.session.expires_at <= now) {
      return {
        isValid: false,
        session: data.session,
        reason: 'expired'
      };
    }

    // Check if access token exists
    if (!data.session.access_token) {
      return {
        isValid: false,
        session: data.session,
        reason: 'invalid_token'
      };
    }

    return {
      isValid: true,
      session: data.session
    };
  } catch (error) {
    console.error('Session validation exception:', error);
    return {
      isValid: false,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      reason: 'network_error'
    };
  }
}

/**
 * Checks if an error is auth-related
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = typeof error === 'string' ? error : error?.message || '';
  const authErrorPatterns = [
    'permission denied',
    'access denied',
    'not authenticated',
    'authentication',
    'unauthorized',
    'forbidden',
    'JWT',
    'token'
  ];
  
  return authErrorPatterns.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}
