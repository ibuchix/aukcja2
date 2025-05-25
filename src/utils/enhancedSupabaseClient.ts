
/**
 * Enhanced Supabase Client with automatic data transformation
 * Handles camelCase <-> snake_case conversion automatically
 */

import { createClient, SupabaseClient, PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';
import type { Database } from '@/integrations/supabase/types';

// Enhanced query builder that adds transformation
class EnhancedPostgrestFilterBuilder<T> {
  private originalBuilder: PostgrestFilterBuilder<any, any, any, any, T>;
  private transformer = dataTransformer;

  constructor(builder: PostgrestFilterBuilder<any, any, any, any, T>) {
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

  // Make the builder thenable for await support
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.originalBuilder.then(
      (result) => {
        if (result.error) {
          return onfulfilled ? onfulfilled(result) : result;
        }
        const transformedResult = {
          ...result,
          data: result.data ? this.transformer.transformResponse(result.data) : result.data
        };
        return onfulfilled ? onfulfilled(transformedResult) : transformedResult;
      },
      onrejected
    );
  }
}

export class EnhancedSupabaseClient {
  private client: SupabaseClient<Database>;
  private transformer = dataTransformer;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient<Database>(supabaseUrl, supabaseKey);
  }

  from(table: string) {
    const originalFrom = this.client.from(table);
    
    return {
      select: (columns?: string) => {
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

  /**
   * Direct RPC calls with transformation
   */
  async rpc(functionName: string, params?: any) {
    const transformedParams = params ? this.transformer.toSnakeCaseObject(params) : params;
    const result = await this.client.rpc(functionName, transformedParams);
    
    if (result.error) {
      return result; // Return errors unchanged
    }
    
    return {
      ...result,
      data: result.data ? this.transformer.transformResponse(result.data) : result.data
    };
  }
}

// Create enhanced client instance
const supabaseUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";

export const enhancedSupabase = new EnhancedSupabaseClient(supabaseUrl, supabaseAnonKey);
