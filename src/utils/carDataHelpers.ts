
import { isValidRecord, isSelectQueryError } from './supabaseHelpers';

export interface CarData {
  id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  auction_end_time?: string;
  current_bid?: number;
  auction_status?: string;
  price?: number;
  mileage?: number;
  images?: string[];
  features?: any;
  transmission?: string;
  status?: string;
  required_photos?: any;
}

/**
 * Type guard for car data
 */
export function isValidCarData(item: any): item is CarData {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  return 'id' in item && typeof item.id === 'string';
}

/**
 * Safely process car data array
 */
export function processCarData<T>(
  cars: any[] | null,
  mapper: (car: CarData) => T
): T[] {
  if (!cars || !Array.isArray(cars)) return [];
  
  return cars
    .filter(isValidCarData)
    .map(mapper);
}

/**
 * Access a property of car data safely with a default value
 */
export function safeCarProperty<K extends keyof CarData>(
  car: any,
  property: K,
  defaultValue: CarData[K]
): CarData[K] {
  if (!car || typeof car !== 'object' || isSelectQueryError(car)) {
    return defaultValue;
  }
  
  return (property in car) ? car[property] : defaultValue;
}

/**
 * Safely access nested objects in car data
 */
export function safeNestedProperty<T>(
  obj: any,
  path: string[],
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object' || isSelectQueryError(obj)) {
    return defaultValue;
  }
  
  let current = obj;
  
  for (const key of path) {
    if (current === null || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current as T;
}
