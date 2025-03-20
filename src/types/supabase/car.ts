
import { BaseRecord, TableRow } from './common';

/**
 * Car record from the database
 */
export type CarRecord = TableRow<'cars'> & BaseRecord;

/**
 * Auction status values
 */
export type AuctionStatus = 'active' | 'ended' | 'sold' | 'cancelled';

/**
 * Car file upload record
 */
export type CarFileUploadRecord = TableRow<'car_file_uploads'> & BaseRecord;

/**
 * Auction schedule record
 */
export type AuctionScheduleRecord = TableRow<'auction_schedules'> & BaseRecord;

/**
 * Car metadata interface
 */
export interface CarFeatures {
  exterior?: string[];
  interior?: string[];
  safety?: string[];
  performance?: string[];
  technology?: string[];
  comfort?: string[];
}
