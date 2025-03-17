
export interface AuctionFilters {
  priceMin?: number;
  priceMax?: number;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  searchQuery?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterFieldProps {
  filters: AuctionFilters;
  onFilterChange: (key: keyof AuctionFilters, value: string) => void;
}
