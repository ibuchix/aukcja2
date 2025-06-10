
import { BaseRecord, TableRow } from '../types/supabase/common';

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
 * Car features interface - using boolean flags for specific features
 */
export interface CarFeatures {
  satNav?: boolean;
  heatedSeats?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  upgradedSound?: boolean;
  // Legacy arrays for backward compatibility
  exterior?: string[];
  interior?: string[];
  safety?: string[];
  performance?: string[];
  technology?: string[];
  comfort?: string[];
}

export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  reservePrice: number;
  currentBid?: number;
  minimumBidIncrement?: number;
  auctionEndTime?: string;
  auctionStatus?: string;
  status?: string;
  images?: string[];
  description?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  condition?: string;
  serviceHistory?: string;
  features?: CarFeatures;
  // New auction schedule fields
  scheduleStatus?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  isManuallyControlled?: boolean;
  auctionTimingStatus?: 'scheduled' | 'running' | 'ended' | 'unknown';
  [key: string]: any;
}
