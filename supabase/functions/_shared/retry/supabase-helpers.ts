
import { SupabaseResponse } from './types';

/**
 * Type guard to check if a response is a Supabase-like response
 */
export function isSupabaseResponse(obj: any): obj is SupabaseResponse {
  return obj && typeof obj === 'object' && ('data' in obj || 'error' in obj);
}
