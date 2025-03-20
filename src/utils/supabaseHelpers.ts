
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { TableRow, TableInsert, TableUpdate } from '@/types/supabase/common';

/**
 * Type-safe helper for checking if response contains data
 */
export function hasData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is PostgrestResponse<T> & { data: NonNullable<T> } {
  return response.data !== null && !response.error;
}

/**
 * Helper to convert query results to strongly typed array
 */
export function asArray<T>(data: T | T[] | null): T[] {
  if (data === null) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Helper to safely access properties that might not exist on error objects
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  return obj[key];
}

/**
 * Type guard for checking if an object has a property
 */
export function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && typeof obj === 'object' && prop in obj;
}

// Simple column name helpers that return string literals 
// This prevents TypeScript type instantiation from becoming excessively deep
export function filterString(column: string): string {
  return column;
}

export function filterBoolean(column: string): string {
  return column;
}

export function matchID(): string {
  return 'id';
}

export function userIDColumn(): string {
  return 'user_id';
}
