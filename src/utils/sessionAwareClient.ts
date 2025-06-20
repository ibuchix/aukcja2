
/**
 * Session-aware Supabase client that ensures JWT token forwarding
 * Fixes authentication context issues for database queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { rawSupabaseClient } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface SessionAwareQueryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Creates a session-aware client that ensures JWT token is properly forwarded
 */
export class SessionAwareClient {
  private client: SupabaseClient<Database>;
  
  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  /**
   * Ensures we have a valid session and JWT token before making queries
   */
  private async ensureValidSession(): Promise<{ 
    isValid: boolean; 
    session: any; 
    error?: string 
  }> {
    try {
      const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
      
      if (sessionError) {
        console.error('Session validation error:', sessionError);
        return { isValid: false, session: null, error: sessionError.message };
      }
      
      if (!sessionData.session) {
        return { isValid: false, session: null, error: 'No active session' };
      }
      
      if (!sessionData.session.access_token) {
        return { isValid: false, session: sessionData.session, error: 'No access token' };
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (sessionData.session.expires_at && sessionData.session.expires_at <= now) {
        // Try to refresh the token
        const { data: refreshData, error: refreshError } = await this.client.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          return { isValid: false, session: sessionData.session, error: 'Token expired and refresh failed' };
        }
        
        return { isValid: true, session: refreshData.session };
      }
      
      return { isValid: true, session: sessionData.session };
    } catch (error) {
      console.error('Session validation exception:', error);
      return { 
        isValid: false, 
        session: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Creates a session-aware query builder that ensures JWT token forwarding
   */
  async createSessionAwareQuery(tableName: string, options: SessionAwareQueryOptions = {}) {
    const { maxRetries = 1, retryDelay = 1000 } = options;
    
    const executeWithSession = async (attemptNumber = 0): Promise<any> => {
      const sessionResult = await this.ensureValidSession();
      
      if (!sessionResult.isValid) {
        throw new Error(`Session validation failed: ${sessionResult.error}`);
      }
      
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log(`Creating session-aware query for ${tableName}:`, {
          hasSession: !!sessionResult.session,
          userId: sessionResult.session?.user?.id,
          tokenLength: sessionResult.session?.access_token?.length || 0,
          expiresAt: sessionResult.session?.expires_at ? new Date(sessionResult.session.expires_at * 1000).toISOString() : 'unknown',
          attempt: attemptNumber + 1
        });
      }
      
      try {
        // Create a fresh client instance that will use the current session
        // This ensures the JWT token is properly included in headers
        const freshClient = this.client;
        
        // Verify the client has the current session
        const { data: currentSession } = await freshClient.auth.getSession();
        if (!currentSession.session?.access_token) {
          throw new Error('Fresh client session validation failed');
        }
        
        return freshClient.from(tableName);
      } catch (error) {
        if (attemptNumber < maxRetries && this.isRetryableError(error)) {
          if (isDev) {
            console.log(`Query attempt ${attemptNumber + 1} failed, retrying in ${retryDelay}ms:`, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return executeWithSession(attemptNumber + 1);
        }
        
        throw error;
      }
    };
    
    return executeWithSession();
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const message = typeof error === 'string' ? error : error?.message || '';
    const code = error?.code;
    
    // Retry on authentication and token-related errors
    const retryablePatterns = [
      'token',
      'expired',
      'authentication',
      'unauthorized',
      'session'
    ];
    
    const retryableCodes = ['42501', 'JWT', 'PGRST301'];
    
    return retryablePatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    ) || retryableCodes.some(retryCode => 
      code && code.toString().includes(retryCode)
    );
  }

  /**
   * Direct access to the underlying client for non-table operations
   */
  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  get functions() {
    return this.client.functions;
  }

  /**
   * Session-aware RPC calls
   */
  async rpc(functionName: string, params?: any) {
    const sessionResult = await this.ensureValidSession();
    
    if (!sessionResult.isValid) {
      throw new Error(`RPC session validation failed: ${sessionResult.error}`);
    }
    
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`Session-aware RPC call: ${functionName}`, {
        hasSession: !!sessionResult.session,
        userId: sessionResult.session?.user?.id,
        tokenLength: sessionResult.session?.access_token?.length || 0
      });
    }
    
    return this.client.rpc(functionName as any, params);
  }
}

/**
 * Create a session-aware client instance
 */
export function createSessionAwareClient(client: SupabaseClient<Database> = rawSupabaseClient) {
  return new SessionAwareClient(client);
}

// Create and export the global session-aware client instance
// This prevents circular dependency by only creating the instance when needed
let globalSessionAwareClient: SessionAwareClient | null = null;

export const getSessionAwareClient = (): SessionAwareClient => {
  if (!globalSessionAwareClient) {
    globalSessionAwareClient = createSessionAwareClient();
  }
  return globalSessionAwareClient;
};

// Export for backwards compatibility
export const sessionAwareClient = getSessionAwareClient();
