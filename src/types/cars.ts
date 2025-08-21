
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
  auctionTimingStatus?: 'scheduled' | 'active' | 'ended' | 'unknown';
  // New image architecture fields
  fileUploads?: Array<{
    id: string;
    car_id: string;
    file_path: string;
    category: string;
    display_order: number;
    file_type: string;
    upload_status: string;
    created_at: string;
  }>;
  requiredPhotos?: Record<string, any>;
  [key: string]: any;
}

/**
 * Helper function to check if a car needs additional photos
 */
export function needsAdditionalPhotos(car: CarRecord): boolean {
  const additionalPhotos = car.additional_photos as string[] | null;
  return !additionalPhotos || additionalPhotos.length === 0;
}

/**
 * Helper function to check if a car needs required photos
 */
export function needsRequiredPhotos(car: CarRecord): boolean {
  const requiredPhotos = car.required_photos as Record<string, any> | null;
  if (!requiredPhotos) return true;
  
  // Check if all required photo categories have at least one photo
  const categories = ['exterior', 'interior', 'engine', 'documents'];
  return categories.some(category => {
    const categoryPhotos = requiredPhotos[category];
    return !categoryPhotos || (Array.isArray(categoryPhotos) && categoryPhotos.length === 0);
  });
}

/**
 * Helper function to get cars that need photos (replacement for the dropped view)
 */
export function getCarsNeedingImages(cars: CarRecord[]): Array<CarRecord & { 
  needs_additional_photos: boolean; 
  needs_required_photos: boolean; 
}> {
  return cars.map(car => ({
    ...car,
    needs_additional_photos: needsAdditionalPhotos(car),
    needs_required_photos: needsRequiredPhotos(car)
  })).filter(car => car.needs_additional_photos || car.needs_required_photos);
}
