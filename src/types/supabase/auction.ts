
import { BaseRecord, TableRow } from './common';

/**
 * Bid record from the database
 */
export type BidRecord = TableRow<'bids'> & BaseRecord;

/**
 * Bid status values
 */
export type BidStatus = 'active' | 'outbid' | 'won' | 'lost';

/**
 * Auction metrics record
 */
export type AuctionMetricsRecord = TableRow<'auction_metrics'> & BaseRecord;

/**
 * Auction results record
 */
export type AuctionResultsRecord = TableRow<'auction_results'> & BaseRecord;

/**
 * Interface for bid history item with related information
 */
export interface BidHistoryItem extends BidRecord {
  dealer_name?: string;
  is_proxy?: boolean;
}
