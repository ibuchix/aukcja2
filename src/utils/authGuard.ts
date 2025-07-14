import { supabase } from '@/integrations/supabase/client';
import { validateCurrentSession } from './sessionValidation';

/**
 * Enhanced auth guard that safely checks if user is authenticated
 * and handles corrupted session states
 */
export async function safeAuthCheck(): Promise<{
  isAuthenticated: boolean;
  userId: string | null;
  error?: string;
}> {
  try {
    // First validate the session
    const validation = await validateCurrentSession();
    
    if (!validation.isValid) {
      console.warn(`Auth check failed: ${validation.reason}`);
      return {
        isAuthenticated: false,
        userId: null,
        error: validation.reason
      };
    }

    return {
      isAuthenticated: true,
      userId: validation.session?.user?.id || null
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return {
      isAuthenticated: false,
      userId: null,
      error: error instanceof Error ? error.message : 'Auth check failed'
    };
  }
}

/**
 * Safe wrapper for operations that require authentication
 * Automatically handles permission checks with dealer_id = auth.uid()
 */
export async function withAuthGuard<T>(
  operation: (userId: string) => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  const authCheck = await safeAuthCheck();
  
  if (!authCheck.isAuthenticated || !authCheck.userId) {
    throw new Error(`${operationName} requires authentication. Current auth state: ${authCheck.error || 'not authenticated'}`);
  }

  console.log(`🔐 Executing ${operationName} with authenticated user: ${authCheck.userId}`);
  
  try {
    return await operation(authCheck.userId);
  } catch (error) {
    // Log auth-related errors for debugging
    if (error instanceof Error && error.message.includes('auth.uid()')) {
      console.error(`❌ Permission error in ${operationName}:`, error.message);
      console.log('🔍 Auth check result:', authCheck);
    }
    throw error;
  }
}