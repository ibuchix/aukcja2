
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

/**
 * Type guard for Supabase error objects
 */
export function isSupabaseError(obj: unknown): obj is { error: PostgrestError } {
  return typeof obj === 'object' && 
    obj !== null && 
    'error' in obj && 
    typeof (obj as any).error === 'object';
}

/**
 * Type guard to check if an item is a valid database record (not an error)
 */
export function isValidRecord<T extends { id: string }>(item: any): item is T {
  return item && 
    typeof item === 'object' && 
    'id' in item && 
    typeof item.id === 'string' && 
    !('error' in item);
}

/**
 * Type guard for nested relations in Supabase queries
 */
export function hasValidRelation<T, K extends keyof T>(
  item: T | null | undefined, 
  relationKey: K
): item is T & Record<K, NonNullable<T[K]>> {
  return item !== null && 
    item !== undefined && 
    relationKey in item && 
    item[relationKey] !== null && 
    item[relationKey] !== undefined;
}
