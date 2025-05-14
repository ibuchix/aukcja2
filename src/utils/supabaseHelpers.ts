
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Type guard for SelectQueryError
 */
export function isSelectQueryError(obj: any): obj is { error: true } & String {
  return obj && typeof obj === 'object' && 'error' in obj && obj.error === true;
}

/**
 * Checks if an object is a valid record (not an error, not null, and an object)
 */
export function isValidRecord<T extends Record<string, any>>(data: any): data is T {
  return data !== null && 
         typeof data === 'object' && 
         !Array.isArray(data) && 
         !isSelectQueryError(data);
}

/**
 * Type guard for valid bid data
 */
export function isValidBid(item: any): boolean {
  return item !== null && 
         typeof item === 'object' && 
         'car_id' in item &&
         'amount' in item;
}

/**
 * Type guard for valid car data
 */
export function isValidCarData(item: any): boolean {
  return item !== null && 
         typeof item === 'object' && 
         'id' in item;
}

/**
 * Type guard for valid proxy log entries
 */
export function isValidProxyLog(item: any): boolean {
  return item !== null && 
         typeof item === 'object' && 
         'entity_id' in item && 
         'details' in item;
}

/**
 * Type guard for valid proxy bid data
 */
export function isValidProxyBidData(item: any): boolean {
  return item !== null && 
         typeof item === 'object' && 
         'car_id' in item && 
         'max_bid_amount' in item;
}

/**
 * Type guard for watchlist items with cars
 */
export function isValidWatchlistWithCar(item: any): boolean {
  return item !== null && 
         typeof item === 'object' && 
         'id' in item && 
         'car_id' in item && 
         'cars' in item && 
         item.cars !== null &&
         typeof item.cars === 'object';
}

/**
 * Safe data transformer function to handle potential error objects
 * @param data The data returned from Supabase
 * @param transformer The transformation function to apply to valid data
 * @param defaultValue The default value to return if data is invalid
 */
export function safeTransform<T, R>(
  data: T | PostgrestError | null | undefined,
  transformer: (validData: T) => R,
  defaultValue: R
): R {
  if (!data || isSelectQueryError(data)) {
    return defaultValue;
  }
  
  try {
    return transformer(data as T);
  } catch (err) {
    console.error("Error transforming data:", err);
    return defaultValue;
  }
}

/**
 * Helper function to safely filter out items that are errors or invalid
 */
export function safeFilter<T>(items: any[], predicate?: (item: T) => boolean): T[] {
  if (!Array.isArray(items)) return [];
  
  // Filter out error objects
  const validItems = items.filter(item => !isSelectQueryError(item)) as T[];
  
  // Apply additional predicate if provided
  return predicate ? validItems.filter(predicate) : validItems;
}

/**
 * Safely filters data using a type guard
 */
export function safelyFilterData<T>(data: any[], typeGuard: (item: any) => item is T): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter(item => !isSelectQueryError(item) && typeGuard(item)) as T[];
}

/**
 * Helper to safely process car data from Supabase responses
 */
export function safeProcessCarData<T, R>(
  data: any[] | null | { error: any },
  transformer: (validItem: T) => R
): R[] {
  // Handle null or error response
  if (!data || isSelectQueryError(data)) {
    return [];
  }
  
  // Ensure we have an array
  if (!Array.isArray(data)) {
    return [];
  }
  
  // Filter out any error objects within the array
  return data
    .filter(item => !isSelectQueryError(item))
    .map(item => {
      try {
        return transformer(item as T);
      } catch (err) {
        console.error("Error transforming item:", err, item);
        return null;
      }
    })
    .filter((item): item is R => item !== null);
}

/**
 * Safely access a property that might not exist
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}

/**
 * Filter and sanitize a string for safe usage
 */
export function filterString(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  // Basic sanitization - remove HTML tags and trim
  return String(value)
    .replace(/<[^>]*>/g, '')
    .trim();
}

