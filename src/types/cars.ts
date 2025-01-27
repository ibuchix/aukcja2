export type CarFeatures = {
  satNav: boolean;
  heatedSeats: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  upgradedSound: boolean;
};

export type AuctionFormat = 'timed' | 'extended';

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
  auction_format?: AuctionFormat;
  extension_trigger_minutes?: number;
  extension_duration_minutes?: number;
  max_extensions_allowed?: number;
  extensions_used?: number;
  is_damaged?: boolean;
  address?: string | null;
  condition_rating?: number;
}