
// Types shared across the proxy bidding processor modules

// Define a type for the proxy bid object
export interface ProxyBid {
  id: string;
  car_id: string;
  dealer_id: string;
  max_bid_amount: number;
  last_processed_amount?: number;
  created_at: string;
  updated_at: string;
}

// Define a type for the car object
export interface Car {
  id: string;
  current_bid: number;
  minimum_bid_increment: number;
  auction_status: string;
  price: number;
}

export interface ProcessResult {
  carId: string;
  processed: boolean;
  newBid?: number;
  previousBid?: number;
  reason?: string;
  error?: string;
  checkpoint?: string;
  transaction_id?: string;
}

export interface ProcessSummary { 
  processed: number; 
  skipped: number; 
  errors: number;
  results: ProcessResult[];
}

export interface CheckpointDetails extends Record<string, any> {
  transaction_id: string;
  stage: string;
  timestamp: string;
}
