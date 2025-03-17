
export interface Bid {
  id: string;
  car_id: string;
  dealer_id: string;
  dealer_name: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  is_proxy: boolean;
}

export interface BidHistoryChartData {
  time: string;
  amount: number;
  bidder: string;
  isProxy: boolean;
}
