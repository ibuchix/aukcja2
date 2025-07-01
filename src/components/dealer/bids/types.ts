
export interface MyBid {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
  car: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    auction_end_time: string;
    current_bid: number;
    auction_status: string;
  };
}
