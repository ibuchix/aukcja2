
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

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
      <CardHeader className={isMobile ? "p-3" : ""}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'}`}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isMobile ? "Filtry" : "Filtry pojazdów"}
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} aktywne</Badge>
            )}
          </div>
          <div className={`flex gap-2 ${isMobile ? 'w-full justify-between' : ''}`}>
            <SavedFiltersManager 
              currentFilters={filters}
              onLoadFilters={handleLoadSavedFilters}
              iconOnly={isMobile}
            />
            <div className={isMobile ? "flex-1 min-w-0" : ""}>
              <SortSelector 
                sortOption={sortOption} 
                onSortChange={onSortChange} 
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className={`space-y-6 ${isMobile ? 'p-3 pt-0' : ''}`}>
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
                Wyczyść wszystkie filtry ({activeFilterCount})
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
