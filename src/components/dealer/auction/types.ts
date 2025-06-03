/**
 * Core auction types for the dealer dashboard
 */

// Auction model representing an auction in the system
export interface Auction {
  id: string;
  title: string;
  auction_end_time: string;
  auction_status: string;
  reserve_price: number;
  price: number;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  current_bid: number | null;
  highest_bid?: {
    amount: number;
    dealer_id: string;
  };
  my_bid?: {
    amount: number;
    status: string;
    car_id?: string; // Optional car_id for mapping bids to cars
  };
  lost_by?: number;
}

// Filters that can be applied to auctions
export interface AuctionFilters {
  make?: string;
  model?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  transmission?: string;
  fuelType?: string;
  serviceHistory?: string;
  distance?: string;
}

// Sort options for auction listings
export interface SortOption {
  value: string;
  label: string;
}

// Props for filter field components
export interface FilterFieldProps {
  filters: AuctionFilters;
  onFilterChange: (key: keyof AuctionFilters, value: string) => void;
}

// Props for auction table component
export interface AuctionTableProps {
  auctions: Auction[] | undefined;
  isLoading: boolean;
  dealerId: string;
}

// Props for auction pagination component
export interface AuctionPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Props for empty state component
export interface AuctionEmptyStateProps {
  hasFilters: boolean;
  hasSearch: boolean;
}

// Props for advanced filter panel component
export interface AdvancedFilterPanelProps {
  showFilters: boolean;
  filters: AuctionFilters;
  onFilterChange: (key: keyof AuctionFilters, value: string) => void;
  clearFilters: () => void;
}

// Props for sort selector component
export interface SortSelectorProps {
  sortOption: string;
  onSortChange: (sort: string) => void;
}

// Props for search bar component
export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (search: string) => void;
}

// Props for the auction filters component
export interface DealerAuctionFiltersProps {
  onFiltersChange: (filters: AuctionFilters) => void;
  onSortChange: (sort: string) => void;
  onSearchChange: (search: string) => void;
  sortOption: string;
  searchQuery: string;
}

// Props for the auction browser component
export interface DealerAuctionBrowserProps {
  dealerId: string;
}
