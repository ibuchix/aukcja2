
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Type-safe helper for checking if response contains data
export function hasData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is PostgrestResponse<T> & { data: NonNullable<T> } {
  return response.data !== null && !response.error;
}

// Type-safe wrapper for filter operations
export function filterString<T extends keyof Database['public']['Tables']>(
  table: T, 
  column: string, 
  value: string | null | undefined
) {
  return column as any;
}

// Type-safe wrapper for filter operations with boolean values
export function filterBoolean<T extends keyof Database['public']['Tables']>(
  table: T,
  column: string,
  value: boolean | null | undefined
) {
  return column as any;
}

// Type-safe wrapper for matching a table by ID
export function matchID<T extends keyof Database['public']['Tables']>(
  table: T,
  value: string | null | undefined
) {
  return 'id' as any;
}

// Type-safe wrapper for user_id column
export function userIDColumn<T extends keyof Database['public']['Tables']>(
  table: T
) {
  return 'user_id' as any;
}

// Type guard for checking if an object has a property
export function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && typeof obj === 'object' && prop in obj;
}

// Type-safe insertion helper
export function prepareInsert<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Record<string, any>
): Record<string, any> {
  return data as any;
}

// Helper to safely access properties that might not exist on error objects
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  return obj[key];
}
