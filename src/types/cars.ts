
export type CarFeatures = {
  // Core features (existing)
  satNav?: boolean;
  heatedSeats?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  upgradedSound?: boolean;
  
  // Additional features from database
  airConditioning?: boolean;
  alloyWheels?: boolean;
  bluetooth?: boolean;
  cruiseControl?: boolean;
  electricWindows?: boolean;
  leatherSeats?: boolean;
  parkingSensors?: boolean;
  keylessEntry?: boolean;
  
  // Allow any additional boolean features for flexibility
  [key: string]: boolean | undefined;
};

// Simplified interface focusing on essential dealer fields
export interface CarListing {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number;
  reservePrice: number; // Essential field - camelCase
  images: string[] | null;
  requiredPhotos: Record<string, string | null> | null;
  
  // Optional fields that are nice to have
  title?: string | null;
  features?: CarFeatures;
  transmission?: string | null;
  isAuction?: boolean;
  auctionEndTime?: string | null;
  minimumBidIncrement?: number | null;
  auctionStatus?: string | null;
  isDamaged?: boolean;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status?: string | null;
  currentBid?: number;
  sellerNotes?: string | null;
  serviceHistoryType?: string | null;
  hasServiceHistory?: boolean;
  sellerId?: string | null;
  sellerName?: string | null;
  mobileNumber?: string | null;
  additionalPhotos?: string[] | null;
  vin?: string | null;
  seatMaterial?: string | null;
  numberOfKeys?: number | null;
  isRegisteredInPoland?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: number | null;
  formMetadata?: any;
  valuationData?: any;
  lastSaved?: string | null;
  registrationNumber?: string | null;
  isManuallyControlled?: boolean;
}
