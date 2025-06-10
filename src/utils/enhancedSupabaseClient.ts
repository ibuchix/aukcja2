
/**
 * Enhanced Supabase Client with automatic data transformation
 * Handles camelCase <-> snake_case conversion automatically
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';
import type { Database } from '@/integrations/supabase/types';

// Enhanced query builder that adds transformation
class EnhancedPostgrestFilterBuilder<T> {
  private originalBuilder: any;
  private transformer = dataTransformer;

  constructor(builder: any) {
    this.originalBuilder = builder;
  }

  // Transform column names for all filter methods
  eq(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.eq(snakeKey, value));
  }

  neq(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.neq(snakeKey, value));
  }

  gt(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.gt(snakeKey, value));
  }

  gte(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.gte(snakeKey, value));
  }

  lt(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.lt(snakeKey, value));
  }

  lte(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.lte(snakeKey, value));
  }

  like(column: string, pattern: string) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.like(snakeKey, pattern));
  }

  ilike(column: string, pattern: string) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.ilike(snakeKey, pattern));
  }

  in(column: string, values: any[]) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: values });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.in(snakeKey, values));
  }

  is(column: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.is(snakeKey, value));
  }

  not(column: string, operator: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.not(snakeKey, operator, value));
  }

  or(filters: string) {
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.or(filters));
  }

  and(filters: string) {
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.and(filters));
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: '' });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.order(snakeKey, options));
  }

  limit(count: number) {
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.limit(count));
  }

  range(from: number, to: number) {
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.range(from, to));
  }

  filter(column: string, operator: string, value: any) {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.filter(snakeKey, operator, value));
  }

  // Updated select method to handle options properly
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (options) {
      return new EnhancedPostgrestFilterBuilder(this.originalBuilder.select(columns, options));
    }
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.select(columns));
  }

  // Result methods that handle transformation
  async single() {
    const result = await this.originalBuilder.single();
    if (result.error) {
      return result; // Return errors unchanged
    }
    return {
      ...result,
      data: result.data ? this.transformer.transformResponse(result.data) : null
    };
  }

  async maybeSingle() {
    const result = await this.originalBuilder.maybeSingle();
    if (result.error) {
      return result; // Return errors unchanged
    }
    return {
      ...result,
      data: result.data ? this.transformer.transformResponse(result.data) : null
    };
  }

  throwOnError() {
    return new EnhancedPostgrestFilterBuilder(this.originalBuilder.throwOnError());
  }

  // FIXED: Enhanced then method for proper transformation
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.originalBuilder.then(
      (result) => {
        if (result.error) {
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

  from(table: string) {
    const originalFrom = this.client.from(table);
    
    return {
      select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
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
