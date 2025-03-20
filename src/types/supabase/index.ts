
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

// Re-export database types
export { Database } from '@/integrations/supabase/types';
