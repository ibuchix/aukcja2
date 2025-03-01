
export type CarFeatures = {
  satNav: boolean;
  heatedSeats: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  upgradedSound: boolean;
};

export interface CarListing {
  id: string;
  title: string | null;
  price: number;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number;
  images: string[] | null;
  description?: string | null; // Made optional
  features: CarFeatures;
  transmission: string | null;
  service_history_files?: string[] | null; // Made optional
  required_photos: Record<string, string | null> | null;
  is_auction?: boolean;
  auction_end_time?: string | null;
  auction_start_time?: string | null;
  reserve_price?: number | null;
  minimum_bid_increment?: number | null;
  auction_status?: string | null;
  is_damaged?: boolean;
  address?: string | null;
  condition_rating?: number;
  distance?: number | null;
  created_at?: string;
  updated_at?: string;
  status?: string | null;
  is_draft?: boolean;
}
