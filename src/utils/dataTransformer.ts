
/**
 * Universal Data Transformer for handling camelCase <-> snake_case conversions
 * This ensures consistent data transformation across the entire application
 */

type CaseStyle = 'camel' | 'snake';

interface TransformOptions {
  deep?: boolean;
  excludeKeys?: string[];
  preserveArrays?: boolean;
}

export class DataTransformer {
  private static instance: DataTransformer;

  static getInstance(): DataTransformer {
    if (!DataTransformer.instance) {
      DataTransformer.instance = new DataTransformer();
    }
    return DataTransformer.instance;
  }

  /**
   * Convert string from camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert string from snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Transform object keys to specified case style
   */
  private transformKeys(
    obj: any,
    targetCase: CaseStyle,
    options: TransformOptions = {}
  ): any {
    const { deep = true, excludeKeys = [], preserveArrays = true } = options;

    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      if (!preserveArrays) return obj;
      return obj.map(item => 
        typeof item === 'object' && item !== null 
          ? this.transformKeys(item, targetCase, options)
          : item
      );
    }

    // Handle primitive types
    if (typeof obj !== 'object' || obj instanceof Date) {
      return obj;
    }

    // Transform object keys
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip excluded keys
      if (excludeKeys.includes(key)) {
        transformed[key] = value;
        continue;
      }

      // Transform the key
      const transformedKey = targetCase === 'snake' 
        ? this.toSnakeCase(key)
        : this.toCamelCase(key);

      // Transform the value if it's an object and deep transformation is enabled
      transformed[transformedKey] = deep && typeof value === 'object' && value !== null
        ? this.transformKeys(value, targetCase, options)
        : value;
    }

    return transformed;
  }

  /**
   * Transform data from camelCase to snake_case (for sending to backend)
   */
  toSnakeCaseObject<T = any>(data: any, options?: TransformOptions): T {
    return this.transformKeys(data, 'snake', options);
  }

  /**
   * Transform data from snake_case to camelCase (for receiving from backend)
   */
  toCamelCaseObject<T = any>(data: any, options?: TransformOptions): T {
    return this.transformKeys(data, 'camel', options);
  }

  /**
   * Transform query filters for Supabase
   */
  transformFilters(filters: Record<string, any>): Record<string, any> {
    return this.toSnakeCaseObject(filters, { 
      deep: false,
      excludeKeys: ['select', 'order', 'limit', 'offset']
    });
  }

  /**
   * Transform form data for submission
   */
  transformFormData(formData: Record<string, any>): Record<string, any> {
    return this.toSnakeCaseObject(formData, {
      excludeKeys: ['id', 'created_at', 'updated_at']
    });
  }

  /**
   * Transform database response to frontend format
   */
  transformResponse<T = any>(response: any): T {
    if (!response) return response;
    
    // Handle single object
    if (!Array.isArray(response)) {
      return this.toCamelCaseObject(response);
    }
    
    // Handle array of objects - use explicit type assertion
    return response.map((item: any) => this.toCamelCaseObject(item)) as T;
  }

  /**
   * Safely transform data with error handling
   */
  safeTransform<T = any>(
    data: any, 
    direction: 'toSnake' | 'toCamel',
    options?: TransformOptions
  ): T {
    try {
      return direction === 'toSnake' 
        ? this.toSnakeCaseObject(data, options)
        : this.toCamelCaseObject(data, options);
    } catch (error) {
      console.error('Data transformation error:', error);
      return data; // Return original data if transformation fails
    }
  }
}

// Export singleton instance
export const dataTransformer = DataTransformer.getInstance();

// Export convenience functions
export const toSnakeCase = (data: any, options?: TransformOptions) => 
  dataTransformer.toSnakeCaseObject(data, options);

export const toCamelCase = (data: any, options?: TransformOptions) => 
  dataTransformer.toCamelCaseObject(data, options);

export const transformForBackend = (data: any) => 
  dataTransformer.transformFormData(data);

export const transformFromBackend = (data: any) => 
  dataTransformer.transformResponse(data);
