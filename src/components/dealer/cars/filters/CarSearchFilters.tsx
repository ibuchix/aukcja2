
import React, { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuctionFilters } from "../../auction/types";
import { PriceRangeFilter } from "./PriceRangeFilter";
import { MileageRangeFilter } from "./MileageRangeFilter";
import { MakeModelFilter } from "./MakeModelFilter";
import { TransmissionFilter } from "./TransmissionFilter";
import { FuelTypeFilter } from "./FuelTypeFilter";
import { ServiceHistoryFilter } from "./ServiceHistoryFilter";
import { DistanceFilter } from "./DistanceFilter";
import { SavedFiltersManager } from "./SavedFiltersManager";
import { SortSelector } from "../../auction/filters/SortSelector";

interface CarSearchFiltersProps {
  filters: AuctionFilters;
  onFilterChange: (key: keyof AuctionFilters, value: string | undefined) => void;
  onFiltersChange: (filters: AuctionFilters) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  sortOption: string;
  searchQuery: string;
}

export const CarSearchFilters: React.FC<CarSearchFiltersProps> = ({
  filters,
  onFilterChange,
  onFiltersChange,
  onSortChange,
  sortOption
}) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).filter(([_, val]) => {
    return val !== '' && val !== null && val !== undefined;
  }).length;

  // Debug logging for filter changes
  useEffect(() => {
    if (isDev) {
      console.log('CarSearchFilters props updated:', {
        filters,
        activeFilterCount,
        filterKeys: Object.keys(filters),
        filterValues: Object.entries(filters).reduce((acc, [key, val]) => {
          acc[key] = val;
          return acc;
        }, {} as Record<string, any>)
      });
    }
  }, [filters, activeFilterCount, isDev]);

  const handleClearAllFilters = useCallback(() => {
    if (isDev) {
      console.log('Clearing all filters');
    }
    onFiltersChange({});
  }, [onFiltersChange, isDev]);

  const handleLoadSavedFilters = useCallback((savedFilters: AuctionFilters) => {
    if (isDev) {
      console.log('Loading saved filters:', savedFilters);
    }
    onFiltersChange(savedFilters);
  }, [onFiltersChange, isDev]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Vehicle Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <SavedFiltersManager 
              currentFilters={filters}
              onLoadFilters={handleLoadSavedFilters}
            />
            <SortSelector 
              sortOption={sortOption} 
              onSortChange={onSortChange} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug info in development */}
        {isDev && (
          <div className="bg-blue-50 p-2 rounded text-xs">
            <strong>Debug:</strong> Active filters: {activeFilterCount} | 
            Current: {Object.keys(filters).join(', ') || 'none'}
          </div>
        )}

        {/* Make and Model Filter */}
        <MakeModelFilter 
          key="make-model-filter"
          selectedMake={filters.make}
          selectedModel={filters.model}
          onMakeChange={(make) => onFilterChange('make', make)}
          onModelChange={(model) => onFilterChange('model', model)}
        />

        {/* Price Range Filter */}
        <PriceRangeFilter 
          key="price-range-filter"
          minPrice={filters.priceMin ? Number(filters.priceMin) : undefined}
          maxPrice={filters.priceMax ? Number(filters.priceMax) : undefined}
          onPriceChange={(min, max) => {
            onFilterChange('priceMin', min?.toString());
            onFilterChange('priceMax', max?.toString());
          }}
        />

        {/* Mileage Range Filter */}
        <MileageRangeFilter 
          key="mileage-range-filter"
          minMileage={filters.mileageMin ? Number(filters.mileageMin) : undefined}
          maxMileage={filters.mileageMax ? Number(filters.mileageMax) : undefined}
          onMileageChange={(min, max) => {
            onFilterChange('mileageMin', min?.toString());
            onFilterChange('mileageMax', max?.toString());
          }}
        />

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TransmissionFilter 
            key="transmission-filter"
            value={filters.transmission}
            onChange={(transmission) => onFilterChange('transmission', transmission)}
          />
          
          <FuelTypeFilter 
            key="fuel-type-filter"
            value={filters.fuelType}
            onChange={(fuelType) => onFilterChange('fuelType', fuelType)}
          />
          
          <ServiceHistoryFilter 
            key="service-history-filter"
            value={filters.serviceHistory}
            onChange={(serviceHistory) => onFilterChange('serviceHistory', serviceHistory)}
          />

          <DistanceFilter 
            key="distance-filter"
            value={filters.distance}
            onChange={(distance) => onFilterChange('distance', distance)}
          />
        </div>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleClearAllFilters}
              className="w-full md:w-auto"
            >
              Clear All Filters ({activeFilterCount})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
