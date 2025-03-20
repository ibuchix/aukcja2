
import { RetryStats } from './types';

// In-memory stats for the current process
const retryStats: RetryStats = {
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0
};

/**
 * Get current retry statistics
 */
export function getRetryStats(): RetryStats {
  return { ...retryStats };
}

/**
 * Update retry statistics
 */
export function updateRetryStats(update: Partial<RetryStats>): void {
  Object.assign(retryStats, update);
}

/**
 * Increment specific retry statistic
 */
export function incrementStat(stat: keyof RetryStats): void {
  retryStats[stat]++;
}
