
/**
 * @deprecated Use types from src/types/supabase instead
 */

import { Database } from "@/integrations/supabase/types";
import { 
  TableRow as TableRowType, 
  TableInsert as TableInsertType 
} from "@/types/supabase/common";

// For backward compatibility
export type TableInsertRow<T extends keyof Database['public']['Tables']> = 
  TableInsertType<T>;

// For backward compatibility
export type TableRow<T extends keyof Database['public']['Tables']> = 
  TableRowType<T>;

// Define record types for specific tables
export type DealerRecord = TableRow<'dealers'>;
export type ProfileRecord = TableRow<'profiles'>;
export type CarRecord = TableRow<'cars'>;
export type BidRecord = TableRow<'bids'>;
export type DealerWatchlistRecord = TableRow<'dealer_watchlist'>;
export type ProxyBidRecord = TableRow<'proxy_bids'>;

// Define insert types for specific tables
export type DealerInsert = TableInsertRow<'dealers'>;
export type ProfileInsert = TableInsertRow<'profiles'>;
export type CarInsert = TableInsertRow<'cars'>;
export type BidInsert = TableInsertRow<'bids'>;
export type DealerWatchlistInsert = TableInsertRow<'dealer_watchlist'>;
export type ProxyBidInsert = TableInsertRow<'proxy_bids'>;
