
// Export type definitions first to avoid potential ordering issues
export type { Database } from '@/integrations/supabase/types';

// Export all the error handling utilities for easy imports
export * from './errorTypes';
export * from './errorHandler';
export * from './authErrorHandler';
export * from './databaseErrorHandler';
export * from './errorReporting';

// Re-export the functions from dealerProfileResultHandler
export { 
  createSuccessResult as createDealerSuccessResult,
  createValidationErrorResult,
  createDatabaseErrorResult as createDealerDatabaseErrorResult,
  createNetworkErrorResult as createDealerNetworkErrorResult,
  handleDatabaseError as handleDealerDatabaseError,
} from '@/services/dealer/dealerProfileResultHandler';

// Re-export the ProfileResult type using 'export type' syntax
export type { ProfileResult } from '@/services/dealer/dealerProfileResultHandler';

