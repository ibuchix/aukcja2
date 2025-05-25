
/**
 * Enhanced Supabase Client with automatic data transformation
 * Handles camelCase <-> snake_case conversion automatically
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';

export class EnhancedSupabaseClient {
  private client: SupabaseClient;
  private transformer = dataTransformer;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Enhanced select query with automatic transformation
   */
  from(table: string) {
    const originalFrom = this.client.from(table);
    
    return {
      select: (columns?: string) => {
        const query = originalFrom.select(columns);
        
        return {
          ...query,
          // Override the original methods to add transformation
          eq: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.eq(snakeKey, value);
          },
          
          neq: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.neq(snakeKey, value);
          },
          
          gt: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.gt(snakeKey, value);
          },
          
          gte: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.gte(snakeKey, value);
          },
          
          lt: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.lt(snakeKey, value);
          },
          
          lte: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.lte(snakeKey, value);
          },
          
          like: (column: string, pattern: string) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.like(snakeKey, pattern);
          },
          
          ilike: (column: string, pattern: string) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.ilike(snakeKey, pattern);
          },
          
          in: (column: string, values: any[]) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: values });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.in(snakeKey, values);
          },
          
          order: (column: string, options?: { ascending?: boolean }) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: '' });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.order(snakeKey, options);
          },
          
          range: (from: number, to: number) => query.range(from, to),
          limit: (count: number) => query.limit(count),
          
          // Transform the final result
          then: async (resolve: any, reject?: any) => {
            try {
              const result = await query;
              if (result.data) {
                result.data = this.transformer.transformResponse(result.data);
              }
              return resolve ? resolve(result) : result;
            } catch (error) {
              return reject ? reject(error) : Promise.reject(error);
            }
          }
        };
      },
      
      insert: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.insert(transformedData);
        
        return {
          ...query,
          then: async (resolve: any, reject?: any) => {
            try {
              const result = await query;
              if (result.data) {
                result.data = this.transformer.transformResponse(result.data);
              }
              return resolve ? resolve(result) : result;
            } catch (error) {
              return reject ? reject(error) : Promise.reject(error);
            }
          }
        };
      },
      
      update: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        const query = originalFrom.update(transformedData);
        
        return {
          ...query,
          eq: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.eq(snakeKey, value);
          },
          then: async (resolve: any, reject?: any) => {
            try {
              const result = await query;
              if (result.data) {
                result.data = this.transformer.transformResponse(result.data);
              }
              return resolve ? resolve(result) : result;
            } catch (error) {
              return reject ? reject(error) : Promise.reject(error);
            }
          }
        };
      },
      
      delete: () => {
        const query = originalFrom.delete();
        
        return {
          ...query,
          eq: (column: string, value: any) => {
            const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
            const snakeKey = Object.keys(snakeColumn)[0];
            return query.eq(snakeKey, value);
          },
          then: async (resolve: any, reject?: any) => {
            try {
              const result = await query;
              return resolve ? resolve(result) : result;
            } catch (error) {
              return reject ? reject(error) : Promise.reject(error);
            }
          }
        };
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
    
    if (result.data) {
      result.data = this.transformer.transformResponse(result.data);
    }
    
    return result;
  }
}

// Create enhanced client instance
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const enhancedSupabase = new EnhancedSupabaseClient(supabaseUrl, supabaseAnonKey);
