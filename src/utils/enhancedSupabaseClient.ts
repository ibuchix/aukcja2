
/**
 * Enhanced Supabase Client with automatic data transformation
 * Handles camelCase <-> snake_case conversion automatically
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';
import type { Database } from '@/integrations/supabase/types';

// Enhanced query builder that adds transformation while preserving authentication
class EnhancedPostgrestFilterBuilder<T> {
  private originalBuilder: any;
  private transformer = dataTransformer;

  constructor(builder: any) {
    this.originalBuilder = builder;
    
    // Debug: Log authentication state preservation
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('EnhancedPostgrestFilterBuilder created with auth context preserved');
    }
  }

  // Helper method to create new instances while preserving authentication
  private createNewInstance(newBuilder: any): EnhancedPostgrestFilterBuilder<T> {
    return new EnhancedPostgrestFilterBuilder(newBuilder);
  }

  // Transform column names for all filter methods
  eq(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.eq(snakeKey, value));
  }

  neq(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.neq(snakeKey, value));
  }

  gt(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.gt(snakeKey, value));
  }

  gte(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.gte(snakeKey, value));
  }

  lt(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.lt(snakeKey, value));
  }

  lte(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.lte(snakeKey, value));
  }

  like(column: string, pattern: string) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.like(snakeKey, pattern));
  }

  ilike(column: string, pattern: string) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.ilike(snakeKey, pattern));
  }

  in(column: string, values: any[]) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: values });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.in(snakeKey, values));
  }

  is(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.is(snakeKey, value));
  }

  not(column: string, operator: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.not(snakeKey, operator, value));
  }

  or(filters: string) {
    return this.createNewInstance(this.originalBuilder.or(filters));
  }

  and(filters: string) {
    return this.createNewInstance(this.originalBuilder.and(filters));
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: '' });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.order(snakeKey, options));
  }

  limit(count: number) {
    return this.createNewInstance(this.originalBuilder.limit(count));
  }

  range(from: number, to: number) {
    return this.createNewInstance(this.originalBuilder.range(from, to));
  }

  filter(column: string, operator: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.createNewInstance(this.originalBuilder.filter(snakeKey, operator, value));
  }

  // Select method to handle options properly
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (options) {
      return this.createNewInstance(this.originalBuilder.select(columns, options));
    }
    return this.createNewInstance(this.originalBuilder.select(columns));
  }

  // Result methods that handle transformation
  async single() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('Enhanced client executing single() query');
    }
    
    const result = await this.originalBuilder.single();
    
    if (isDev) {
      console.log('Single query result:', { 
        hasError: !!result.error, 
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        hasData: !!result.data 
      });
    }
    
    if (result.error) {
      return result; // Return errors unchanged
    }
    return {
      ...result,
      data: result.data ? this.transformer.transformResponse(result.data) : null
    };
  }

  async maybeSingle() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('Enhanced client executing maybeSingle() query');
    }
    
    const result = await this.originalBuilder.maybeSingle();
    
    if (isDev) {
      console.log('MaybeSingle query result:', { 
        hasError: !!result.error, 
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        hasData: !!result.data 
      });
    }
    
    if (result.error) {
      return result; // Return errors unchanged
    }
    return {
      ...result,
      data: result.data ? this.transformer.transformResponse(result.data) : null
    };
  }

  throwOnError() {
    return this.createNewInstance(this.originalBuilder.throwOnError());
  }

  // Enhanced then method for proper transformation
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    const isDev = process.env.NODE_ENV === 'development';
    
    return this.originalBuilder.then(
      async (result) => {
        if (isDev) {
          console.log('Enhanced query result received:', { 
            hasError: !!result.error, 
            errorMessage: result.error?.message,
            errorCode: result.error?.code,
            hasData: !!result.data,
            dataLength: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0)
          });
        }
        
        if (result.error) {
          if (isDev) {
            console.error('Enhanced query error details:', result.error);
          }
          return onfulfilled ? onfulfilled(result) : result;
        }
        
        // Enhanced transformation logic
        let transformedData = result.data;
        
        if (result.data) {
          if (Array.isArray(result.data)) {
            // Transform each item in the array
            transformedData = result.data.map(item => this.transformer.transformResponse(item));
          } else {
            // Transform single object
            transformedData = this.transformer.transformResponse(result.data);
          }
        }
        
        const transformedResult = {
          ...result,
          data: transformedData
        };
        
        if (isDev) {
          console.log('Enhanced query transformation complete:', {
            originalCount: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
            transformedCount: Array.isArray(transformedData) ? transformedData.length : (transformedData ? 1 : 0)
          });
        }
        
        return onfulfilled ? onfulfilled(transformedResult) : transformedResult;
      },
      onrejected
    );
  }
}

export class EnhancedSupabaseClient {
  private client: SupabaseClient<Database>;
  private transformer = dataTransformer;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.client = supabaseClient;
    
    // Debug: Verify authentication context is preserved
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('Enhanced Supabase Client initialized - debugging auth context preservation');
      this.debugAuthenticationState();
    }
  }

  // Authentication debugging method
  private async debugAuthenticationState() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('Enhanced client auth verification:', {
          hasSession: !!session,
          userId: session?.user?.id,
          sessionExists: !!session,
          authError: error?.message,
          clientType: 'enhanced',
          accessToken: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'none'
        });
      }
    } catch (error) {
      console.error('Enhanced client auth debugging failed:', error);
    }
  }

  from(table: string) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`Enhanced client creating query for table: ${table}`);
    }
    
    // Get the original from builder - this should preserve ALL authentication context
    const originalFrom = this.client.from(table);
    
    // DEBUG: Verify authentication context is preserved in the from builder
    if (isDev) {
      console.log(`Original from builder created for table: ${table}`);
      this.verifyAuthenticationForwarding(originalFrom, table);
    }
    
    return {
      select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        if (isDev) {
          console.log(`Enhanced client select query for ${table}:`, { columns, options });
        }
        
        if (options) {
          const query = originalFrom.select(columns, options);
          return new EnhancedPostgrestFilterBuilder(query);
        }
        const query = originalFrom.select(columns);
        return new EnhancedPostgrestFilterBuilder(query);
      },
      
      insert: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.insert(transformedData);
        return new EnhancedPostgrestFilterBuilder(query);
      },
      
      update: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.update(transformedData);
        return new EnhancedPostgrestFilterBuilder(query);
      },
      
      delete: () => {
        const query = originalFrom.delete();
        return new EnhancedPostgrestFilterBuilder(query);
      },

      upsert: (data: any, options?: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.upsert(transformedData, options);
        return new EnhancedPostgrestFilterBuilder(query);
      }
    };
  }

  // Method to verify authentication forwarding
  private async verifyAuthenticationForwarding(fromBuilder: any, table: string) {
    try {
      const { data: { session } } = await this.client.auth.getSession();
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log(`Auth verification for ${table} query - session check:`, {
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString(),
          table
        });

        // Test a simple auth check to see if auth.uid() works
        try {
          const authTest = await this.client.rpc('debug_auth_context');
          console.log(`Auth context test for ${table}:`, {
            authTestResult: authTest.data,
            authTestError: authTest.error?.message
          });
        } catch (error) {
          console.log(`Auth context test failed for ${table}:`, error);
        }
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
    }
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
   * Direct RPC calls - preserve authentication context completely
   */
  async rpc(functionName: string, params?: any) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`Enhanced client RPC call: ${functionName}`, { params });
      
      // Check authentication before RPC call
      const { data: { session } } = await this.client.auth.getSession();
      console.log('Auth context for RPC call:', {
        hasSession: !!session,
        userId: session?.user?.id,
        rpcFunction: functionName
      });
    }
    
    const transformedParams = params ? this.transformer.toSnakeCaseObject(params) : params;
    
    // Use the original client's RPC method directly to preserve auth context
    const result = await this.client.rpc(functionName as any, transformedParams);
    
    if (isDev) {
      console.log(`RPC ${functionName} result:`, { 
        hasError: !!result.error, 
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        hasData: !!result.data 
      });
    }
    
    if (result.error) {
      return result; // Return errors unchanged
    }
    
    // For RPC calls, return data as-is since many database functions
    // already return data in the expected format
    return result;
  }
}

// Create a function that wraps any Supabase client with enhancement features
export function createEnhancedSupabaseClient(supabaseClient: SupabaseClient<Database>) {
  return new EnhancedSupabaseClient(supabaseClient);
}
