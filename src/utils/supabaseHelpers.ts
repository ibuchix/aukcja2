
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

// Type-safe helper for checking if response contains data
export function hasData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is PostgrestResponse<T> & { data: NonNullable<T> } {
  return response.data !== null && !response.error;
}

// Simplified string column helper - returns the column name as a simple string
export function filterString(
  column: string
): string {
  return column;
}

// Simplified boolean column helper - returns the column name as a simple string
export function filterBoolean(
  column: string
): string {
  return column;
}

// Simple ID column helper - just returns 'id' as a string
export function matchID(): string {
  return 'id';
}

// Simple user_id column helper - just returns 'user_id' as a string
export function userIDColumn(): string {
  return 'user_id';
}

// Type guard for checking if an object has a property
export function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && typeof obj === 'object' && prop in obj;
}

// Simplified insertion helper
export function prepareInsert(
  data: Record<string, any>
): Record<string, any> {
  return data;
}

// Helper to safely access properties that might not exist on error objects
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  return obj[key];
}
