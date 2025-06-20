
/**
 * Enhanced Supabase Client with automatic data transformation and improved auth forwarding
 * Handles camelCase <-> snake_case conversion automatically
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { dataTransformer } from './dataTransformer';
import { getSessionAwareClient } from './sessionAwareClient';
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
      console.log('EnhancedPostgrestFilterBuilder created with preserved auth context');
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
      console.log('Enhanced client executing single() query with JWT forwarding');
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
      console.log('Enhanced client executing maybeSingle() query with JWT forwarding');
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

  // Enhanced then method for proper transformation and error handling
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    const isDev = process.env.NODE_ENV === 'development';
    
    return this.originalBuilder.then(
      async (result) => {
        if (isDev) {
          console.log('Enhanced query result received with JWT forwarding:', { 
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
      (error) => {
        // Enhanced error handling
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          console.error('Enhanced query promise rejection:', error);
        }
        return onrejected ? onrejected(error) : Promise.reject(error);
      }
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

  // FIXED: Return synchronous query builders instead of async Promises
  from(table: string) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`Enhanced client creating session-aware query for table: ${table}`);
    }
    
    // Create session-aware query builders that return immediately
    return {
      select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        return this.createEnhancedQueryBuilder(table, 'select', { columns, options });
      },
      
      insert: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        return this.createEnhancedQueryBuilder(table, 'insert', { data: transformedData });
      },
      
      update: (data: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        return this.createEnhancedQueryBuilder(table, 'update', { data: transformedData });
      },
      
      delete: () => {
        return this.createEnhancedQueryBuilder(table, 'delete', {});
      },

      upsert: (data: any, options?: any) => {
        const transformedData = this.transformer.toSnakeCaseObject(data);
        return this.createEnhancedQueryBuilder(table, 'upsert', { data: transformedData, options });
      }
    };
  }

  // Create enhanced query builder that wraps session-aware queries
  private createEnhancedQueryBuilder(table: string, operation: string, params: any) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`Creating enhanced query builder for ${operation} on ${table}`);
    }
    
    // Create a proxy that will handle session-aware queries when executed
    const sessionAwareProxy = {
      // Store the operation details for later execution
      _table: table,
      _operation: operation,
      _params: params,
      
      // Return a proper query builder interface immediately
      eq: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        
        // Return a new proxy with the filter applied
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.eq(snakeKey, value));
      },
      
      neq: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.neq(snakeKey, value));
      },
      
      gt: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.gt(snakeKey, value));
      },
      
      gte: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.gte(snakeKey, value));
      },
      
      lt: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.lt(snakeKey, value));
      },
      
      lte: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.lte(snakeKey, value));
      },
      
      like: (column: string, pattern: string) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.like(snakeKey, pattern));
      },
      
      ilike: (column: string, pattern: string) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.ilike(snakeKey, pattern));
      },
      
      in: (column: string, values: any[]) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: values });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.in(snakeKey, values));
      },
      
      is: (column: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.is(snakeKey, value));
      },
      
      not: (column: string, operator: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.not(snakeKey, operator, value));
      },
      
      or: (filters: string) => {
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.or(filters));
      },
      
      and: (filters: string) => {
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.and(filters));
      },
      
      order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: '' });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.order(snakeKey, options));
      },
      
      limit: (count: number) => {
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.limit(count));
      },
      
      range: (from: number, to: number) => {
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.range(from, to));
      },
      
      filter: (column: string, operator: string, value: any) => {
        const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
        const snakeKey = Object.keys(snakeColumn)[0];
        return this.createFilteredQueryBuilder(table, operation, params, (query) => query.filter(snakeKey, operator, value));
      },
      
      select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        return this.createFilteredQueryBuilder(table, 'select', { columns, options }, (query) => {
          return options ? query.select(columns, options) : query.select(columns);
        });
      },
      
      // Execution methods that trigger the actual query
      single: async () => {
        const sessionAwareClient = getSessionAwareClient();
        const query = await sessionAwareClient.createSessionAwareQuery(table);
        let builtQuery = this.buildQuery(query, operation, params);
        const result = await builtQuery.single();
        return this.transformResult(result);
      },
      
      maybeSingle: async () => {
        const sessionAwareClient = getSessionAwareClient();
        const query = await sessionAwareClient.createSessionAwareQuery(table);
        let builtQuery = this.buildQuery(query, operation, params);
        const result = await builtQuery.maybeSingle();
        return this.transformResult(result);
      },
      
      then: (onfulfilled?: any, onrejected?: any) => {
        return this.executeQuery(table, operation, params, []).then(onfulfilled, onrejected);
      }
    };
    
    return sessionAwareProxy;
  }
  
  // Create filtered query builder that chains filters
  private createFilteredQueryBuilder(table: string, operation: string, params: any, filterFn: (query: any) => any) {
    const filters = params._filters || [];
    const newFilters = [...filters, filterFn];
    
    return this.createEnhancedQueryBuilder(table, operation, { 
      ...params, 
      _filters: newFilters 
    });
  }
  
  // Build the actual query with all filters applied
  private buildQuery(query: any, operation: string, params: any) {
    let builtQuery;
    
    switch (operation) {
      case 'select':
        builtQuery = params.options ? 
          query.select(params.columns, params.options) : 
          query.select(params.columns);
        break;
      case 'insert':
        builtQuery = query.insert(params.data);
        break;
      case 'update':
        builtQuery = query.update(params.data);
        break;
      case 'delete':
        builtQuery = query.delete();
        break;
      case 'upsert':
        builtQuery = query.upsert(params.data, params.options);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Apply all filters
    if (params._filters) {
      for (const filterFn of params._filters) {
        builtQuery = filterFn(builtQuery);
      }
    }
    
    return builtQuery;
  }
  
  // Execute the query with session awareness
  private async executeQuery(table: string, operation: string, params: any, filters: any[]) {
    const sessionAwareClient = getSessionAwareClient();
    const query = await sessionAwareClient.createSessionAwareQuery(table);
    
    let builtQuery = this.buildQuery(query, operation, { ...params, _filters: filters });
    const result = await builtQuery;
    
    return this.transformResult(result);
  }
  
  // Transform the result with camelCase conversion
  private transformResult(result: any) {
    if (result.error) {
      return result;
    }
    
    let transformedData = result.data;
    
    if (result.data) {
      if (Array.isArray(result.data)) {
        transformedData = result.data.map(item => this.transformer.transformResponse(item));
      } else {
        transformedData = this.transformer.transformResponse(result.data);
      }
    }
    
    return {
      ...result,
      data: transformedData
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
    const sessionAwareClient = getSessionAwareClient();
    return sessionAwareClient.rpc(functionName, params);
  }
}

// Create a function that wraps any Supabase client with enhancement features
export function createEnhancedSupabaseClient(supabaseClient: SupabaseClient<Database>) {
  return new EnhancedSupabaseClient(supabaseClient);
}
