
/**
 * Updated Car types - all cars are immediately available once created
 */

export interface CarListing {
  id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price: number;
  mileage?: number;
  transmission?: string;
  status: string; // 'available', 'sold', 'withdrawn', etc.
  sellerId?: string;
  features?: Record<string, any>;
  images?: string[];
  isAuction?: boolean;
  auctionStatus?: string;
  auctionEndTime?: string;
  currentBid?: number;
  reservePrice?: number;
  minimumBidIncrement?: number;
  createdAt: string;
  updatedAt: string;
  sellerName?: string;
  address?: string;
  mobileNumber?: string;
  sellerNotes?: string;
  serviceHistoryType?: string;
  seatMaterial?: string;
  numberOfKeys?: number;
  isDamaged?: boolean;
  isRegisteredInPoland?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: number;
  additionalPhotos?: any;
  formMetadata?: any;
  valuationData?: any;
  requiredPhotos?: any;
  lastSaved?: string;
}

export interface CarFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
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
  price: number;
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
  isDamaged?: boolean;
  isRegisteredInPoland?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: number;
  additionalPhotos?: any;
  formMetadata?: any;
  valuationData?: any;
  requiredPhotos?: any;
}
