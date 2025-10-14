
export interface CarData {
  id: string;
  title?: string;
  auction_end_time?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  current_bid?: number;
  reserve_price?: number;
  is_auction?: boolean;
  auction_status?: string;
  town?: string;
  county?: string;
  // Auction schedule fields
  schedule_status?: string;
  schedule_start_time?: string;
  schedule_end_time?: string;
  is_manually_controlled?: boolean;
}

export interface BidData {
  car_id: string;
  amount: number;
  status?: string;
}
