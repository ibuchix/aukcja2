
import React, { useState } from "react";
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
  onSearchChange: (search: string) => void; // Keep for compatibility but won't use
  onSortChange: (sort: string) => void;
  sortOption: string;
  searchQuery: string; // Keep for compatibility but won't use
}

export const CarSearchFilters: React.FC<CarSearchFiltersProps> = ({
  onFiltersChange,
  onSortChange,
  sortOption
}) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const handleFilterChange = (key: keyof AuctionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Remove empty values
    Object.keys(newFilters).forEach(filterKey => {
      if (newFilters[filterKey as keyof AuctionFilters] === '' || 
          newFilters[filterKey as keyof AuctionFilters] === null ||
          newFilters[filterKey as keyof AuctionFilters] === undefined) {
        delete newFilters[filterKey as keyof AuctionFilters];
      }
    });
    
    setFilters(newFilters);
    setActiveFilterCount(Object.keys(newFilters).length);
    onFiltersChange(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setActiveFilterCount(0);
    onFiltersChange({});
  };

  const handleLoadSavedFilters = (savedFilters: AuctionFilters) => {
    setFilters(savedFilters);
    setActiveFilterCount(Object.keys(savedFilters).length);
    onFiltersChange(savedFilters);
  };

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
          minPrice={filters.priceMin}
          maxPrice={filters.priceMax}
          onPriceChange={(min, max) => {
            handleFilterChange('priceMin', min);
            handleFilterChange('priceMax', max);
          }}
        />

        {/* Mileage Range Filter */}
        <MileageRangeFilter 
          minMileage={filters.mileageMin}
          maxMileage={filters.mileageMax}
          onMileageChange={(min, max) => {
            handleFilterChange('mileageMin', min);
            handleFilterChange('mileageMax', max);
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
