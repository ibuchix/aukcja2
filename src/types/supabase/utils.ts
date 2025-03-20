
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

/**
 * Type for Supabase client with database type information
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Helper type for query filters
 */
export interface QueryFilters {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Helper type for pagination params
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/**
 * Helper type for sort params
 */
export interface SortParams {
  column: string;
  ascending?: boolean;
}

/**
 * Generic response interface for API requests
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}
