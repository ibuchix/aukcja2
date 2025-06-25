
import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  onFiltersChange: (filters: AuctionFilters) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  sortOption: string;
  searchQuery: string;
}

export const CarSearchFilters: React.FC<CarSearchFiltersProps> = ({
  onFiltersChange,
  onSortChange,
  sortOption
}) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const isDev = process.env.NODE_ENV === 'development';

  // Debug logging for filter changes
  useEffect(() => {
    if (isDev) {
      console.log('CarSearchFilters state updated:', {
        filters,
        activeFilterCount,
        filterKeys: Object.keys(filters)
      });
    }
  }, [filters, activeFilterCount, isDev]);

  // Debounced filter change to prevent rapid API calls
  const debouncedOnFiltersChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (newFilters: AuctionFilters) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onFiltersChange(newFilters);
      }, 300);
    };
  }, [onFiltersChange]);

  const handleFilterChange = useCallback((key: keyof AuctionFilters, value: string | undefined) => {
    if (isDev) {
      console.log('Filter change requested:', { key, value, currentFilters: filters });
    }

    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      // Handle the filter value - only remove if explicitly empty
      if (value === '' || value === null || value === undefined) {
        delete newFilters[key];
        if (isDev) {
          console.log(`Removed filter key: ${key}`);
        }
      } else {
        newFilters[key] = value;
        if (isDev) {
          console.log(`Set filter ${key} = ${value}`);
        }
      }

      // Count active filters more accurately
      const activeCount = Object.entries(newFilters).filter(([_, val]) => {
        return val !== '' && val !== null && val !== undefined;
      }).length;
      
      setActiveFilterCount(activeCount);
      
      if (isDev) {
        console.log('New filters state:', {
          newFilters,
          activeCount,
          changedKey: key,
          changedValue: value
        });
      }
      
      // Use debounced callback to prevent rapid API calls
      debouncedOnFiltersChange(newFilters);
      
      return newFilters;
    });
  }, [filters, debouncedOnFiltersChange, isDev]);

  const handleClearAllFilters = useCallback(() => {
    if (isDev) {
      console.log('Clearing all filters');
    }
    setFilters({});
    setActiveFilterCount(0);
    onFiltersChange({});
  }, [onFiltersChange, isDev]);

  const handleLoadSavedFilters = useCallback((savedFilters: AuctionFilters) => {
    if (isDev) {
      console.log('Loading saved filters:', savedFilters);
    }
    setFilters(savedFilters);
    const activeCount = Object.entries(savedFilters).filter(([_, val]) => {
      return val !== '' && val !== null && val !== undefined;
    }).length;
    setActiveFilterCount(activeCount);
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
        {/* Make and Model Filter */}
        <MakeModelFilter 
          selectedMake={filters.make}
          selectedModel={filters.model}
          onMakeChange={(make) => handleFilterChange('make', make)}
          onModelChange={(model) => handleFilterChange('model', model)}
        />

        {/* Price Range Filter */}
        <PriceRangeFilter 
          minPrice={filters.priceMin ? Number(filters.priceMin) : undefined}
          maxPrice={filters.priceMax ? Number(filters.priceMax) : undefined}
          onPriceChange={(min, max) => {
            handleFilterChange('priceMin', min?.toString());
            handleFilterChange('priceMax', max?.toString());
          }}
        />

        {/* Mileage Range Filter */}
        <MileageRangeFilter 
          minMileage={filters.mileageMin ? Number(filters.mileageMin) : undefined}
          maxMileage={filters.mileageMax ? Number(filters.mileageMax) : undefined}
          onMileageChange={(min, max) => {
            handleFilterChange('mileageMin', min?.toString());
            handleFilterChange('mileageMax', max?.toString());
          }}
        />

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TransmissionFilter 
            value={filters.transmission}
            onChange={(transmission) => handleFilterChange('transmission', transmission)}
          />
          
          <FuelTypeFilter 
            value={filters.fuelType}
            onChange={(fuelType) => handleFilterChange('fuelType', fuelType)}
          />
          
          <ServiceHistoryFilter 
            value={filters.serviceHistory}
            onChange={(serviceHistory) => handleFilterChange('serviceHistory', serviceHistory)}
          />

          <DistanceFilter 
            value={filters.distance}
            onChange={(distance) => handleFilterChange('distance', distance)}
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
