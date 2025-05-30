
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

export interface CarListing {
  id: string;
  title: string | null;
  reserve_price: number; // Changed from price to reserve_price
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number;
  images: string[] | null;
  features: CarFeatures;
  transmission: string | null;
  required_photos: Record<string, string | null> | null;
  is_auction?: boolean;
  auction_end_time?: string | null;
  minimum_bid_increment?: number | null;
  auction_status?: string | null;
  is_damaged?: boolean;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
  status?: string | null;
  current_bid?: number;
  seller_notes?: string | null;
  service_history_type?: string | null;
  has_service_history?: boolean;
  seller_id?: string | null;
  seller_name?: string | null;
  mobile_number?: string | null;
  additional_photos?: string[] | null;
  vin?: string | null;
  seat_material?: string | null;
  number_of_keys?: number | null;
  is_registered_in_poland?: boolean;
  has_private_plate?: boolean;
  finance_amount?: number | null;
  form_metadata?: any;
  valuation_data?: any;
  last_saved?: string | null;
  registration_number?: string | null;
  is_manually_controlled?: boolean;
}
