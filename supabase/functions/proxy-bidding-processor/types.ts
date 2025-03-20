
/**
 * Car record with auction details
 */
export interface Car {
  id: string;
  current_bid?: number;
  minimum_bid_increment?: number;
  auction_status: string;
  price: number;
}

/**
 * Proxy bid record
 */
export interface ProxyBid {
  id: string;
  car_id: string;
  dealer_id: string;
  max_bid_amount: number;
  created_at: string;
}

/**
 * Result of processing a single auction
 */
export interface ProcessResult {
  carId: string;
  processed: boolean;
  reason?: string;
  newBid?: number;
  previousBid?: number;
  transaction_id?: string;
  error?: string;
}

/**
 * Summary of processing multiple auctions
 */
export interface ProcessSummary {
  processed: number;
  skipped: number;
  errors: number;
  results: ProcessResult[];
}

/**
 * Checkpoint details for logging
 */
export interface CheckpointDetails {
  transaction_id: string;
  stage: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Performance metrics for logging
 */
export interface PerformanceMetrics {
  module: string;
  operation: string;
  duration_ms: number;
  success: boolean;
  details: Record<string, any>;
}

/**
 * Retry attempt details for logging
 */
export interface RetryAttemptDetails {
  module: string;
  operation: string;
  attempt: number;
  max_retries: number;
  error: string;
  error_stack?: string | null;
  context: Record<string, any>;
  timestamp: string;
}
