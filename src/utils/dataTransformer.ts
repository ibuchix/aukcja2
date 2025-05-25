
/**
 * Data transformation utilities for converting between camelCase and snake_case
 */

class DataTransformer {
  /**
   * Convert camelCase object keys to snake_case
   */
  toSnakeCaseObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.toSnakeCaseObject(item));

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = this.toSnakeCase(key);
      result[snakeKey] = this.toSnakeCaseObject(value);
    }
    return result;
  }

  /**
   * Convert snake_case object keys to camelCase
   */
  toCamelCaseObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.toCamelCaseObject(item));

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.toCamelCase(key);
      result[camelKey] = this.toCamelCaseObject(value);
    }
    return result;
  }

  /**
   * Transform response data from snake_case to camelCase
   */
  transformResponse(data: any): any {
    return this.toCamelCaseObject(data);
  }

  /**
   * Convert camelCase string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case string to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

export const dataTransformer = new DataTransformer();
