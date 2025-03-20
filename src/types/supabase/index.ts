
/**
 * Central export file for all Supabase-related types
 */

// Re-export types from domain-specific files
export * from './auth';
export * from './auction';
export * from './dealer';
export * from './car';
export * from './common';
export * from './utils';

// Re-export database types - fixing the type export syntax
export type { Database } from '@/integrations/supabase/types';
