
// Export type definitions first to avoid potential ordering issues
export type { Database } from '@/integrations/supabase/types';

// Export all the error handling utilities for easy imports
export * from './errorTypes';
export * from './errorHandler';
export * from './authErrorHandler';
export * from './databaseErrorHandler';
export * from './errorReporting';

// Re-export the existing dealerProfileResultHandler for backward compatibility
export { 
  createSuccessResult as createDealerSuccessResult,
  createValidationErrorResult,
  createDatabaseErrorResult as createDealerDatabaseErrorResult,
  createNetworkErrorResult as createDealerNetworkErrorResult,
  handleDatabaseError as handleDealerDatabaseError,
  ProfileResult
} from '@/services/dealer/dealerProfileResultHandler';
