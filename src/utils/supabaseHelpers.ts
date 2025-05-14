import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { TableRow, TableInsert, TableUpdate } from '@/types/supabase/common';

// Interface for Supabase responses with error property
export interface SupabaseResponse {
  data: any;
  error?: PostgrestError;
}

// Interface for common error response from Supabase
export interface SelectQueryError {
  error: true;
}

/**
 * Type guard to check if a response is a Supabase-like response
 */
export function isSupabaseResponse(obj: any): obj is SupabaseResponse {
  return obj && typeof obj === 'object' && ('data' in obj || 'error' in obj);
}

/**
 * Type-safe helper for checking if response contains data
 */
export function hasData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>
): response is PostgrestResponse<T> & { data: NonNullable<T> } {
  return response.data !== null && !response.error;
}

/**
 * Helper to convert query results to strongly typed array
 */
export function asArray<T>(data: T | T[] | null): T[] {
  if (data === null) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Helper to safely access properties that might not exist on error objects
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  return obj[key];
}

/**
 * Type guard for checking if an object has a property
 */
export function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && typeof obj === 'object' && prop in obj;
}

/**
 * Type guard for Supabase error objects
 */
export function isSupabaseError(obj: unknown): obj is { error: PostgrestError } {
  return typeof obj === 'object' && 
    obj !== null && 
    'error' in obj && 
    typeof (obj as any).error === 'object';
}

/**
 * Type guard to check if an object is a SelectQueryError
 * Helpful for handling errors in nested relations
 */
export function isSelectQueryError(obj: any): obj is SelectQueryError {
  return obj && typeof obj === 'object' && obj.error === true;
}

/**
 * Type guard to check if an object is a SelectQueryError
 * Helpful for handling errors in nested relations
 */
export function isSelectQueryError(obj: any): obj is SelectQueryError {
  return obj && typeof obj === 'object' && obj.error === true;
}

/**
 * Type guard to check if an item is a valid database record (not an error)
 */
export function isValidRecord<T extends { id?: string }>(item: any): item is T {
  if (!item || typeof item !== 'object') return false;
  
  // Check if this is a SelectQueryError
  if (isSelectQueryError(item)) return false;
  
  // Normal validation
  return 'id' in item && 
    typeof item.id === 'string' && 
    !('error' in item);
}

/**
 * Type guard for nested relations in Supabase queries
 */
export function hasValidRelation<T, K extends keyof T>(
  item: T | null | undefined, 
  relationKey: K
): item is T & Record<K, NonNullable<T[K]>> {
  if (item === null || item === undefined) return false;
  
  if (!(relationKey in item)) return false;
  
  const relation = item[relationKey];
  
  // Check if the relation is a SelectQueryError
  if (relation !== null && relation !== undefined && isSelectQueryError(relation)) {
    return false;
  }
  
  return relation !== null && relation !== undefined;
}

/**
 * Safe filter function that ensures item is not null, undefined, or a SelectQueryError
 */
export function safeFilter<T>(item: T | null | undefined | SelectQueryError): item is T {
  if (item === null || item === undefined) return false;
  return !isSelectQueryError(item);
}

/**
 * Type guard for checking if a bid is valid and has all required properties
 */
export function isValidBid(bid: any): bid is { 
  id: string;
  car_id: string; 
  amount: number;
  dealer_id?: string;
  status?: string;
  created_at: string;
  updated_at: string;
} {
  if (!bid || typeof bid !== 'object') return false;
  if (isSelectQueryError(bid)) return false;
  
  return 'id' in bid &&
    'car_id' in bid && 
    'amount' in bid && 
    'created_at' in bid &&
    typeof bid.amount === 'number';
}

/**
 * Type guard specifically for checking car data validity
 */
export function isValidCarData(item: any): item is {
  id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  auction_end_time?: string;
  current_bid?: number;
  auction_status?: string;
} {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  
  return 'id' in item && typeof item.id === 'string';
}

/**
 * Type guard for proxy bid data
 */
export function isValidProxyBidData(item: any): item is {
  car_id: string;
  max_bid_amount: number;
} {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  
  return 'car_id' in item && 
    'max_bid_amount' in item && 
    typeof item.car_id === 'string' &&
    typeof item.max_bid_amount === 'number';
}

/**
 * Type guard specifically for watchlist items
 */
export function isValidWatchlistItem(item: any): item is {
  id: string;
  car_id: string;
  cars?: any;
} {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  
  return 'id' in item && 'car_id' in item;
}

/**
 * Type guard for proxy logs
 */
export function isValidProxyLog(item: any): item is {
  id: string;
  entity_id: string;
  user_id: string;
  details: Record<string, any>;
  created_at: string;
} {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  
  return 'id' in item &&
    'entity_id' in item &&
    'user_id' in item &&
    'details' in item &&
    'created_at' in item;
}

/**
 * Type guard for auction data
 */
export function isValidAuctionData(item: any): item is {
  id: string;
  car_id?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
} {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  
  return 'id' in item && typeof item.id === 'string';
}

/**
 * Type guard for bid history item
 */
export function isValidBidHistoryItem(item: any): item is {
  id: string;
  car_id: string;
  dealer_id: string;
  amount: number;
  status?: string;
  created_at: string;
  dealer_name?: string;
} {
  if (!item || typeof item !== 'object') return false;
  if (isSelectQueryError(item)) return false;
  
  return 'id' in item &&
    'car_id' in item &&
    'dealer_id' in item &&
    'amount' in item &&
    'created_at' in item;
}

/**
 * Safe function to filter data using a type guard
 * @param data The data to check
 * @param typeGuard The type guard function to use
 * @returns The data filtered by the type guard, or an empty array if there was an error
 */
export function safelyFilterData<T>(
  data: any[] | null | undefined,
  typeGuard: (item: any) => item is T
): T[] {
  if (!data || !Array.isArray(data)) return [];
  return data.filter(item => !isSelectQueryError(item) && typeGuard(item));
}

/**
 * Generic helper to format data for the UI with proper type checking
 */
export function formatForDisplay<T, U>(
  data: any[] | null | undefined,
  typeGuard: (item: any) => item is T,
  mapper: (item: T) => U
): U[] {
  const validItems = safelyFilterData(data, typeGuard);
  return validItems.map(mapper);
}

/**
 * Type guard specifically for watchlist items with car relation
 */
export function isValidWatchlistWithCar(item: any): item is {
  id: string;
  car_id: string;
  cars: {
    id: string;
    title?: string;
    make?: string;
    model?: string;
    year?: number;
    price?: number;
    auction_end_time?: string;
    auction_status?: string;
    is_auction?: boolean;
    reserve_price?: number;
  };
} {
  if (!isValidWatchlistItem(item)) return false;
  
  // Check if cars relation exists and is valid
  return 'cars' in item && 
    item.cars !== null && 
    typeof item.cars === 'object' &&
    'id' in item.cars;
}
