
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

// Use 'export type' for Database type (fixing TS1205 error with isolatedModules)
export type { Database } from '@/integrations/supabase/types';
