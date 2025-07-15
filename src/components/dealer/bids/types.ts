
export interface MyBid {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
  auctionTimingStatus?: string;
  car: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    auction_end_time: string;
    current_bid: number;
    auction_status: string;
    reserve_price?: number;
    awaiting_seller_decision?: boolean;
  };
}
