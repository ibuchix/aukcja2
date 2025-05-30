
/**
 * Updated Car types - all cars are immediately available once created
 */

export interface CarListing {
  id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  reserve_price: number; // Changed from price to reserve_price
  mileage?: number;
  transmission?: string;
  status: string; // 'available', 'sold', 'withdrawn', etc.
  sellerId?: string;
  features?: Record<string, any>;
  images?: string[]; // Array of strings (text[])
  is_auction?: boolean;
  auction_status?: string;
  auction_end_time?: string;
  current_bid?: number;
  minimum_bid_increment?: number;
  created_at: string;
  updated_at: string;
  sellerName?: string;
  address?: string;
  mobileNumber?: string;
  sellerNotes?: string;
  serviceHistoryType?: string;
  seatMaterial?: string;
  numberOfKeys?: number;
  is_damaged?: boolean;
  isRegisteredInPoland?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: number;
  additionalPhotos?: any;
  formMetadata?: any;
  valuationData?: any;
  required_photos?: Record<string, string>; // JSONB object with string values
  lastSaved?: string;
}

export interface CarFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number; // Still called priceMin for UI purposes, but will map to reserve_price
  priceMax?: number; // Still called priceMax for UI purposes, but will map to reserve_price
  mileageMin?: number;
  mileageMax?: number;
  transmission?: string;
  status?: string;
}

export interface CarFormData {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  reserve_price: number; // Changed from price to reserve_price
  mileage?: number;
  transmission?: string;
  features?: Record<string, any>;
  sellerName?: string;
  address?: string;
  mobileNumber?: string;
  sellerNotes?: string;
  serviceHistoryType?: string;
  seatMaterial?: string;
  numberOfKeys?: number;
  is_damaged?: boolean;
  isRegisteredInPoland?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: number;
  additionalPhotos?: any;
  formMetadata?: any;
  valuationData?: any;
  required_photos?: Record<string, string>;
}
