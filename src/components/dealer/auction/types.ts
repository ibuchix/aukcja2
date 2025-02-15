
export interface Auction {
  id: string;
  title: string;
  auction_end_time: string;
  auction_status: string;
  reserve_price: number;
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
