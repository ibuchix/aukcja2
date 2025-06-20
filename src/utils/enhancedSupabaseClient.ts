
/**
 * Enhanced Supabase Client with automatic data transformation and improved auth forwarding
 * Handles camelCase <-> snake_case conversion automatically
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';
import { getSessionAwareClient } from './sessionAwareClient';
import { EnhancedQueryBuilder } from './enhancedQueryBuilder';
import type { Database } from '@/integrations/supabase/types';

export class EnhancedSupabaseClient {
  private client: SupabaseClient<Database>;
  private transformer = dataTransformer;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.client = supabaseClient;
    
    // Debug: Verify authentication context is preserved
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('Enhanced Supabase Client initialized with JWT token forwarding');
      this.debugAuthenticationState();
    }
  }

  // Enhanced authentication debugging method
  private async debugAuthenticationState() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('Enhanced client auth verification with JWT forwarding:', {
          hasSession: !!session,
          userId: session?.user?.id,
          sessionExists: !!session,
          authError: error?.message,
          clientType: 'enhanced-jwt-forwarding',
          accessToken: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'none',
          tokenLength: session?.access_token?.length || 0,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
        });
      }
    } catch (error) {
      console.error('Enhanced client auth debugging failed:', error);
    }
  }

  // Return proper query builders that are awaitable
  from(table: string) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`Enhanced client creating session-aware query for table: ${table}`);
    }
    
    return {
      select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        return new EnhancedQueryBuilder(table, 'select', { columns, options });
      },
      
      insert: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        return new EnhancedQueryBuilder(table, 'insert', { data: transformedData });
      },
      
      update: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        return new EnhancedQueryBuilder(table, 'update', { data: transformedData });
      },
      
      delete: () => {
        return new EnhancedQueryBuilder(table, 'delete', {});
      },

      upsert: (data: any, options?: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        return new EnhancedQueryBuilder(table, 'upsert', { data: transformedData, options });
      }
    };
  }

  /**
   * Direct access to the original Supabase client for operations that need full context
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

  get realtime() {
    return this.client.realtime;
  }

  // Add missing channel and removeChannel methods
  channel(name: string, opts?: any) {
    return this.client.channel(name, opts);
  }

  removeChannel(channel: any) {
    return this.client.removeChannel(channel);
  }

  /**
   * Enhanced RPC calls with session-aware authentication
   */
  async rpc(functionName: string, params?: any) {
    const sessionAwareClient = await getSessionAwareClient();
    return sessionAwareClient.rpc(functionName, params);
  }
}

// Create a function that wraps any Supabase client with enhancement features
export function createEnhancedSupabaseClient(supabaseClient: SupabaseClient<Database>) {
  return new EnhancedSupabaseClient(supabaseClient);
}
