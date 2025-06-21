
import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AuctionFilters } from '../auction/types';
import { useSimplifiedCarListingsQuery } from './hooks/useSimplifiedCarListingsQuery';
import { LiveAuctionCard } from './LiveAuctionCard';
import { AuctionFiltersComponent } from './AuctionFiltersComponent';
import { AuctionSortSelect } from './AuctionSortSelect';
import { AuctionPagination } from './AuctionPagination';
import { Skeleton } from "@/components/ui/skeleton";

interface SimpleLiveAuctionsViewProps {
  dealerId: string;
  dealerProfile?: any;
  isProfileLoading?: boolean;
}

export const SimpleLiveAuctionsView: React.FC<SimpleLiveAuctionsViewProps> = ({
  dealerId,
  dealerProfile,
  isProfileLoading = false
}) => {
  const [filters, setFilters] = useState<AuctionFilters>({
    make: '',
    model: '',
    yearFrom: undefined,
    yearTo: undefined,
    priceFrom: undefined,
    priceTo: undefined,
    mileageFrom: undefined,
    mileageTo: undefined,
    transmission: '',
    fuelType: '',
    bodyType: '',
    location: ''
  });
  
  const [sortOption, setSortOption] = useState('ending_soon');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Use the simplified query instead of the original one
  const { 
    data: queryResult, 
    isLoading, 
    error,
    refetch 
  } = useSimplifiedCarListingsQuery({
    filters,
    sortOption,
    searchQuery,
    currentPage,
    pageSize,
    dealerId
  });

  const cars = queryResult?.cars || [];
  const totalCars = queryResult?.total || 0;

  // Show loading skeleton
  if (isLoading || isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load live auctions: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="space-y-4">
        <AuctionFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {totalCars} live auctions found
          </div>
          
          <AuctionSortSelect
            value={sortOption}
            onValueChange={setSortOption}
          />
        </div>
      </div>

      {/* Results */}
      {cars.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No live auctions found matching your criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <LiveAuctionCard
                key={car.id}
                car={car}
                dealerId={dealerId}
              />
            ))}
          </div>

          <AuctionPagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCars / pageSize)}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};
