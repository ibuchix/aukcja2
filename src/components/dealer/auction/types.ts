
export interface Auction {
  id: string;
  title: string;
  auction_end_time: string;
  auction_status: string;
  reserve_price: number;
  price: number;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  current_bid: number | null;
  highest_bid?: {
    amount: number;
    dealer_id: string;
  };
  my_bid?: {
    amount: number;
    status: string;
  };
  lost_by?: number;
}

export interface AuctionFilters {
  priceMin?: number;
  priceMax?: number;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  searchQuery?: string;
}
