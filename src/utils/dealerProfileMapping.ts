
/**
 * Legacy utility functions for dealer profile mapping
 * Consider using the newer modules in dealer-profile-utils instead
 */

import { normalizeEmail as normalizeEmailNew } from "./dealer-profile-utils/normalizers";

/**
 * Normalizes email by trimming and converting to lowercase
 * @deprecated Use normalizeEmail from dealer-profile-utils/normalizers instead
 */
export function normalizeEmail(email: string): string {
  return normalizeEmailNew(email);
}

/**
 * Maps profile data from form values to database structure
 * @deprecated Use mapFormToDatabase from dealer-profile-utils/formatters instead
 */
export function mapFormToDatabase(values: any): Record<string, any> {
  // Import the new mapper to maintain compatibility
  const { mapFormToDatabase } = require('./dealer-profile-utils/formatters');
  return mapFormToDatabase(values);
}
