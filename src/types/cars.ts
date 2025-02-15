
export type CarFeatures = {
  satNav: boolean;
  heatedSeats: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  upgradedSound: boolean;
};

export interface CarListing {
  id: string;
  title: string;
  price: number;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number;
  images: string[] | null;
  description: string | null;
  features: CarFeatures;
  transmission: string | null;
  service_history_files: string[] | null;
  required_photos: Record<string, string | null> | null;
  is_auction?: boolean;
  auction_end_time?: string;
  auction_start_time?: string;
  reserve_price?: number;
  minimum_bid_increment?: number;
  auction_status?: string;
  is_damaged?: boolean;
  address?: string | null;
  condition_rating?: number;
  distance?: number | null;
}
