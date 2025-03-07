
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Type-safe helper for checking if response contains data
export function hasData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is PostgrestResponse<T> & { data: NonNullable<T> } {
  return response.data !== null && !response.error;
}

// Simplified filter helpers that avoid excessive type recursion
export function filterString(
  table: string, 
  column: string, 
  value: string | null | undefined
): string {
  return column;
}

export function filterBoolean(
  table: string,
  column: string,
  value: boolean | null | undefined
): string {
  return column;
}

export function matchID(
  table: string,
  value: string | null | undefined
): string {
  return 'id';
}

export function userIDColumn(
  table: string
): string {
  return 'user_id';
}

// Type guard for checking if an object has a property
export function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && typeof obj === 'object' && prop in obj;
}

// Simplified insertion helper
export function prepareInsert(
  table: string,
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
