
/**
 * Enhanced Supabase Client with automatic data transformation
 * Handles camelCase <-> snake_case conversion automatically
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';
import type { Database } from '@/integrations/supabase/types';

// Enhanced query builder that adds transformation AND preserves authentication
class EnhancedPostgrestFilterBuilder<T> {
  private originalBuilder: any;
  private transformer = dataTransformer;
  private authContext: any; // Store auth context

  constructor(builder: any, authContext?: any) {
    this.originalBuilder = builder;
    this.authContext = authContext;
    
    // Enhanced logging to track authentication preservation
    if (process.env.NODE_ENV === 'development') {
      const hasAuth = authContext?.session?.access_token || authContext?.headers?.Authorization;
      console.log('=== ENHANCED BUILDER AUTH CHECK ===');
      console.log('Auth context available:', !!authContext);
      console.log('Has access token:', !!authContext?.session?.access_token);
      console.log('Has auth headers:', !!authContext?.headers?.Authorization);
      console.log('Builder type:', typeof builder);
    }
  }

  // Helper method to create new instances with preserved auth context
  private createNewInstance(newBuilder: any): EnhancedPostgrestFilterBuilder<T> {
    return new EnhancedPostgrestFilterBuilder(newBuilder, this.authContext);
  }

  // Transform column names for all filter methods - WITH AUTH PRESERVATION
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

  // Updated select method to handle options properly - WITH AUTH PRESERVATION
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (options) {
      return this.createNewInstance(this.originalBuilder.select(columns, options));
    }
    return this.createNewInstance(this.originalBuilder.select(columns));
  }

  // Result methods that handle transformation - WITH AUTH PRESERVATION
  async single() {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ENHANCED CLIENT SINGLE QUERY ===');
      console.log('Auth context in single():', !!this.authContext);
    }
    
    const result = await this.originalBuilder.single();
    if (result.error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('=== ENHANCED CLIENT QUERY ERROR ===');
        console.error('Error:', result.error);
        console.error('Error code:', result.error.code);
        console.error('Error message:', result.error.message);
      }
      return result; // Return errors unchanged
    }
    return {
      ...result,
      data: result.data ? this.transformer.transformResponse(result.data) : null
    };
  }

  async maybeSingle() {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ENHANCED CLIENT MAYBE_SINGLE QUERY ===');
      console.log('Auth context in maybeSingle():', !!this.authContext);
    }
    
    const result = await this.originalBuilder.maybeSingle();
    if (result.error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('=== ENHANCED CLIENT QUERY ERROR ===');
        console.error('Error:', result.error);
      }
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

  // FIXED: Enhanced then method for proper transformation WITH AUTH PRESERVATION
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ENHANCED CLIENT THEN METHOD ===');
      console.log('Auth context in then():', !!this.authContext);
    }
    
    return this.originalBuilder.then(
      (result) => {
        if (result.error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('=== ENHANCED CLIENT THEN ERROR ===');
            console.error('Error:', result.error);
            console.error('Error code:', result.error.code);
            console.error('Error message:', result.error.message);
            if (result.error.message?.includes('permission denied')) {
              console.error('PERMISSION DENIED - likely auth context lost');
              console.error('Auth context available:', !!this.authContext);
            }
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
        
        // Log transformation in development
        if (process.env.NODE_ENV === 'development') {
          console.log('=== ENHANCED SUPABASE TRANSFORMATION ===');
          console.log('Original data count:', Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0));
          console.log('Transformed data count:', Array.isArray(transformedData) ? transformedData.length : (transformedData ? 1 : 0));
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            console.log('Sample original:', result.data[0]);
            console.log('Sample transformed:', transformedData[0]);
          }
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
  }

  // Get current auth context for preservation
  private getAuthContext() {
    const session = this.client.auth.session;
    const headers = this.client.auth.headers;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ENHANCED CLIENT AUTH CONTEXT ===');
      console.log('Session available:', !!session);
      console.log('Headers available:', !!headers);
      console.log('Access token available:', !!session?.access_token);
    }
    
    return {
      session,
      headers,
      client: this.client
    };
  }

  from(table: string) {
    const originalFrom = this.client.from(table);
    const authContext = this.getAuthContext();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== ENHANCED CLIENT FROM "${table}" ===`);
      console.log('Auth context for table:', !!authContext);
    }
    
    return {
      select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        if (options) {
          const query = originalFrom.select(columns, options);
          return new EnhancedPostgrestFilterBuilder(query, authContext);
        }
        const query = originalFrom.select(columns);
        return new EnhancedPostgrestFilterBuilder(query, authContext);
      },
      
      insert: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.insert(transformedData);
        return new EnhancedPostgrestFilterBuilder(query, authContext);
      },
      
      update: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.update(transformedData);
        return new EnhancedPostgrestFilterBuilder(query, authContext);
      },
      
      delete: () => {
        const query = originalFrom.delete();
        return new EnhancedPostgrestFilterBuilder(query, authContext);
      },

      upsert: (data: any, options?: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.upsert(transformedData, options);
        return new EnhancedPostgrestFilterBuilder(query, authContext);
      }
    };
  }

  /**
   * Access to the original Supabase client for advanced operations
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
   * Direct RPC calls - DON'T transform the response for RPC calls
   * as they often return data already in the expected format
   */
  async rpc(functionName: string, params?: any) {
    const transformedParams = params ? this.transformer.toSnakeCaseObject(params) : params;
    const result = await this.client.rpc(functionName as any, transformedParams);
    
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
