
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

// Add the audit log action types for better type safety
export type AuditLogAction = 
  | "login" 
  | "logout" 
  | "create" 
  | "update" 
  | "delete" 
  | "suspend" 
  | "reinstate" 
  | "verify" 
  | "reject" 
  | "approve" 
  | "process_auctions" 
  | "auction_closed" 
  | "auto_proxy_bid"
  | "proxy_bid" 
  | "proxy_bid_checkpoint"
  | "start_auction" 
  | "auction_close_failed" 
  | "auction_close_system_error"
  | "system_reset_failed" 
  | "recovery_failed" 
  | "manual_retry" 
  | "auction_recovery" 
  | "system_health_check" 
  | "system_alert";
