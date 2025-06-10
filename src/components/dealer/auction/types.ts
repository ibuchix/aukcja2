
import { BaseRecord, TableRow } from '../../../types/supabase/common';

export interface AuctionFilters {
  priceMin?: string;
  priceMax?: string;
  make?: string;
  model?: string;
  yearMin?: string;
  yearMax?: string;
  mileageMin?: string;
  mileageMax?: string;
  transmission?: string;
  fuelType?: string;
  serviceHistory?: string;
  distance?: string;
}

export interface AuctionPaginationResult<T> {
  auctions: T[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface Auction {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  auction_end_time?: string;
  auction_status: string;
  current_bid: number;
  reserve_price: number;
  reserve_met: boolean;
  lost_by?: number; // Add missing property
  my_bid?: {
    amount: number;
    status: 'active' | 'outbid' | 'won' | 'lost' | 'winning'; // Add 'winning' status
    car_id: string;
  };
  highest_bid?: {
    amount: number;
    dealer_id: string;
  };
  // New auction schedule fields
  schedule_status?: string;
  schedule_start_time?: string;
  schedule_end_time?: string;
  is_manually_controlled?: boolean;
  auction_timing_status?: 'scheduled' | 'running' | 'ended' | 'unknown';
  auctionTimingStatus?: 'scheduled' | 'running' | 'ended' | 'unknown'; // Add camelCase version for consistency
}

export interface DealerAuctionBrowserProps {
  dealerId: string;
}

export interface FilterFieldProps {
  filters: AuctionFilters;
  onFilterChange: (field: keyof AuctionFilters, value: string) => void;
}

export interface AuctionTableProps {
  auctions: Auction[];
  isLoading: boolean;
  dealerId: string;
}

export interface DealerAuctionFiltersProps {
  onFiltersChange: (filters: AuctionFilters) => void;
  onSortChange: (sortOption: string) => void;
  onSearchChange: (searchQuery: string) => void;
  sortOption: string;
  searchQuery: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface SortSelectorProps {
  sortOption: string;
  onSortChange: (sortOption: string) => void;
}

export interface AdvancedFilterPanelProps {
  showFilters: boolean;
  filters: AuctionFilters;
  onFilterChange: (field: keyof AuctionFilters, value: string) => void;
  clearFilters: () => void;
}
