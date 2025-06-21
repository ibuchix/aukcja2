
/**
 * Session-aware query wrapper with retry logic for permission errors
 */

import { supabase } from '@/integrations/supabase/client';
import { SessionDebugger } from './sessionDebugger';

interface QueryRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  context?: string;
}

export class SessionAwareQueryBuilder {
  private static async refreshSessionIfNeeded(): Promise<boolean> {
    try {
      const debugInfo = await SessionDebugger.captureSessionState('Pre-refresh check');
      
      if (!SessionDebugger.hasValidSession(debugInfo)) {
        console.log('[SessionAwareQuery] Refreshing session due to invalid state');
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('[SessionAwareQuery] Session refresh failed:', error);
          return false;
        }
        
        if (data.session) {
          await SessionDebugger.captureSessionState('Post-refresh success');
          return true;
        }
      }
      
      return SessionDebugger.hasValidSession(debugInfo);
    } catch (error) {
      console.error('[SessionAwareQuery] Session refresh error:', error);
      return false;
    }
  }
  
  static async executeQuery<T>(
    queryBuilder: () => Promise<{ data: T | null; error: any }>,
    options: QueryRetryOptions = {}
  ): Promise<{ data: T | null; error: any }> {
    const { maxRetries = 2, retryDelay = 1000, context = 'unknown' } = options;
    
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt <= maxRetries) {
      try {
        // Capture session state before query
        await SessionDebugger.captureSessionState(`${context} - Attempt ${attempt + 1}`);
        
        // Execute the query
        const result = await queryBuilder();
        
        // If successful, return immediately
        if (!result.error) {
          if (attempt > 0) {
            console.log(`[SessionAwareQuery] ${context} succeeded after ${attempt} retries`);
          }
          return result;
        }
        
        // Check if this is a permission error that might be session-related
        const isPermissionError = result.error?.code === '42501' || 
                                  result.error?.message?.includes('permission denied') ||
                                  result.error?.message?.includes('JWT');
        
        if (isPermissionError && attempt < maxRetries) {
          console.warn(`[SessionAwareQuery] ${context} permission error, attempting session refresh:`, result.error);
          
          // Try to refresh session
          const refreshed = await this.refreshSessionIfNeeded();
          
          if (refreshed) {
            console.log(`[SessionAwareQuery] Session refreshed, retrying ${context}`);
            attempt++;
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          } else {
            console.error(`[SessionAwareQuery] Session refresh failed for ${context}`);
            return result; // Return the permission error
          }
        }
        
        // For non-permission errors or final attempt, return the error
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`[SessionAwareQuery] ${context} attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        } else {
          break;
        }
      }
    }
    
    // All retries exhausted
    return { 
      data: null, 
      error: lastError || new Error(`Query failed after ${maxRetries + 1} attempts`) 
    };
  }
}
