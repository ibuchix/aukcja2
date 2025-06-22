
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { AuctionFilters } from '../auction/types';

interface AuctionFiltersComponentProps {
  filters: AuctionFilters;
  onFiltersChange: (filters: AuctionFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const AuctionFiltersComponent: React.FC<AuctionFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange
}) => {
  const handleFilterChange = (key: keyof AuctionFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by make, model, or title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Make"
          value={filters.make || ''}
          onChange={(e) => handleFilterChange('make', e.target.value)}
        />
        
        <Input
          placeholder="Model"
          value={filters.model || ''}
          onChange={(e) => handleFilterChange('model', e.target.value)}
        />
        
        <Input
          placeholder="Min Year"
          type="number"
          value={filters.yearFrom || ''}
          onChange={(e) => handleFilterChange('yearFrom', e.target.value ? parseInt(e.target.value) : undefined)}
        />
        
        <Input
          placeholder="Max Year"
          type="number"
          value={filters.yearTo || ''}
          onChange={(e) => handleFilterChange('yearTo', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </div>

      {/* Price and Mileage Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Min Price"
          type="number"
          value={filters.priceFrom || ''}
          onChange={(e) => handleFilterChange('priceFrom', e.target.value ? parseInt(e.target.value) : undefined)}
        />
        
        <Input
          placeholder="Max Price"
          type="number"
          value={filters.priceTo || ''}
          onChange={(e) => handleFilterChange('priceTo', e.target.value ? parseInt(e.target.value) : undefined)}
        />
        
        <Input
          placeholder="Min Mileage"
          type="number"
          value={filters.mileageFrom || ''}
          onChange={(e) => handleFilterChange('mileageFrom', e.target.value ? parseInt(e.target.value) : undefined)}
        />
        
        <Input
          placeholder="Max Mileage"
          type="number"
          value={filters.mileageTo || ''}
          onChange={(e) => handleFilterChange('mileageTo', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </div>
    </div>
  );
};
