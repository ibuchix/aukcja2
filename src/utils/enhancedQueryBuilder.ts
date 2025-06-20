
/**
 * Enhanced Query Builder that supports method chaining and proper Promise behavior
 * This ensures that query builders can be properly awaited while supporting filter chaining
 */

import { dataTransformer } from './dataTransformer';
import { getSessionAwareClient } from './sessionAwareClient';

interface QueryParams {
  table: string;
  operation: string;
  data?: any;
  columns?: string;
  options?: any;
  filters: Array<(query: any) => any>;
}

export class EnhancedQueryBuilder implements Promise<any> {
  private params: QueryParams;
  private transformer = dataTransformer;

  constructor(table: string, operation: string, initialParams: any = {}) {
    this.params = {
      table,
      operation,
      ...initialParams,
      filters: []
    };
  }

  // Filter methods that return new instances for chaining
  eq(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    
    return this.addFilter((query) => query.eq(snakeKey, value));
  }

  neq(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.neq(snakeKey, value));
  }

  gt(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.gt(snakeKey, value));
  }

  gte(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.gte(snakeKey, value));
  }

  lt(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.lt(snakeKey, value));
  }

  lte(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.lte(snakeKey, value));
  }

  like(column: string, pattern: string): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.like(snakeKey, pattern));
  }

  ilike(column: string, pattern: string): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: pattern });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.ilike(snakeKey, pattern));
  }

  in(column: string, values: any[]): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: values });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.in(snakeKey, values));
  }

  is(column: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.is(snakeKey, value));
  }

  not(column: string, operator: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.not(snakeKey, operator, value));
  }

  or(filters: string): EnhancedQueryBuilder {
    return this.addFilter((query) => query.or(filters));
  }

  and(filters: string): EnhancedQueryBuilder {
    return this.addFilter((query) => query.and(filters));
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: '' });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.order(snakeKey, options));
  }

  limit(count: number): EnhancedQueryBuilder {
    return this.addFilter((query) => query.limit(count));
  }

  range(from: number, to: number): EnhancedQueryBuilder {
    return this.addFilter((query) => query.range(from, to));
  }

  filter(column: string, operator: string, value: any): EnhancedQueryBuilder {
    const snakeColumn = this.transformer.toSnakeCaseObject({ [column]: value });
    const snakeKey = Object.keys(snakeColumn)[0];
    return this.addFilter((query) => query.filter(snakeKey, operator, value));
  }

  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): EnhancedQueryBuilder {
    const newBuilder = this.clone();
    newBuilder.params.operation = 'select';
    newBuilder.params.columns = columns;
    newBuilder.params.options = options;
    return newBuilder;
  }

  // Execution methods
  async single() {
    const result = await this.execute();
    return result.data && Array.isArray(result.data) && result.data.length > 0 
      ? { ...result, data: result.data[0] }
      : result;
  }

  async maybeSingle() {
    const result = await this.execute();
    return result.data && Array.isArray(result.data) && result.data.length > 0 
      ? { ...result, data: result.data[0] }
      : { ...result, data: null };
  }

  // Promise implementation
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<any | TResult> {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<any> {
    return this.execute().finally(onfinally);
  }

  // Required for Promise compatibility
  readonly [Symbol.toStringTag]: string = 'EnhancedQueryBuilder';

  // Helper methods
  private addFilter(filterFn: (query: any) => any): EnhancedQueryBuilder {
    const newBuilder = this.clone();
    newBuilder.params.filters.push(filterFn);
    return newBuilder;
  }

  private clone(): EnhancedQueryBuilder {
    const newBuilder = new EnhancedQueryBuilder(this.params.table, this.params.operation, {
      data: this.params.data,
      columns: this.params.columns,
      options: this.params.options
    });
    newBuilder.params.filters = [...this.params.filters];
    return newBuilder;
  }

  private async execute(): Promise<any> {
    const sessionAwareClient = getSessionAwareClient();
    const query = await sessionAwareClient.createSessionAwareQuery(this.params.table);
    
    let builtQuery = this.buildQuery(query);
    const result = await builtQuery;
    
    return this.transformResult(result);
  }

  private buildQuery(query: any) {
    let builtQuery;
    
    switch (this.params.operation) {
      case 'select':
        builtQuery = this.params.options ? 
          query.select(this.params.columns, this.params.options) : 
          query.select(this.params.columns);
        break;
      case 'insert':
        builtQuery = query.insert(this.params.data);
        break;
      case 'update':
        builtQuery = query.update(this.params.data);
        break;
      case 'delete':
        builtQuery = query.delete();
        break;
      case 'upsert':
        builtQuery = query.upsert(this.params.data, this.params.options);
        break;
      default:
        throw new Error(`Unknown operation: ${this.params.operation}`);
    }
    
    // Apply all filters
    for (const filterFn of this.params.filters) {
      builtQuery = filterFn(builtQuery);
    }
    
    return builtQuery;
  }

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
}
