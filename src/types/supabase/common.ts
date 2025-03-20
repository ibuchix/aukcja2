
import { Database } from '@/integrations/supabase/types';

/**
 * Base type for all database records
 */
export interface BaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Helper type for extracting table row types from the Database type
 */
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type for inserting into tables
 */
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper type for updating table records
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Helper type for returning records from RPC functions
 */
export type RPCReturn<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns'];
