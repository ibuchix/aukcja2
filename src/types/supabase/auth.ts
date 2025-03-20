
import { BaseRecord, TableRow } from './common';

/**
 * Profile record with user information
 */
export type ProfileRecord = TableRow<'profiles'> & BaseRecord;

/**
 * User roles available in the system
 */
export type UserRole = 'dealer' | 'seller' | 'admin';

/**
 * Extended user session information
 */
export interface SessionInfo {
  userId: string;
  email: string;
  role?: UserRole;
  expiresAt?: number;
  isAuthenticated: boolean;
}
