
import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useSimplifiedCarListingsQuery } from './hooks/useSimplifiedCarListingsQuery';
import { LiveAuctionCard } from './LiveAuctionCard';
import { CarSearchFilters } from './filters/CarSearchFilters';
import { AuctionPagination } from './AuctionPagination';
import { Skeleton } from "@/components/ui/skeleton";
import { useCarFilters } from './hooks/useCarFilters';
import { LiveAuctionDetailsDialog } from './LiveAuctionDetailsDialog';

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
  const [selectedCar, setSelectedCar] = useState<any>(null);
  
  const {
    filters,
    debouncedFilters,
    sortOption,
    searchQuery,
    currentPage,
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    cleanup
  } = useCarFilters();

  const pageSize = 12;

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Use the simplified query with debounced filters for API calls
  const { 
    data: queryResult, 
    isLoading, 
    error,
    refetch 
  } = useSimplifiedCarListingsQuery({
    filters: debouncedFilters, // Use debounced filters for API calls
    sortOption,
    searchQuery,
    currentPage,
    pageSize,
    dealerId
  });

  const cars = queryResult?.cars || [];
  const totalCars = queryResult?.total || 0;

  const handleCarClick = (car: any) => {
    setSelectedCar(car);
  };

  const handleCloseDialog = () => {
    setSelectedCar(null);
  };

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

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCars / pageSize);

  // Create a page change handler that works with the existing pagination component
  const handlePageChange = (page: number) => {
    const pageDirection = page > currentPage ? 'next' : 'previous';
    if (pageDirection === 'next') {
      handleNextPage();
    } else {
      handlePreviousPage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Comprehensive Filters and Search */}
      <CarSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        searchQuery={searchQuery}
      />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {totalCars} live auctions found
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
                onClick={handleCarClick}
              />
            ))}
          </div>

          <AuctionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Live Auction Details Dialog */}
      <LiveAuctionDetailsDialog
        car={selectedCar}
        dealerId={dealerId}
        isVerified={dealerProfile?.is_verified || false}
        onClose={handleCloseDialog}
      />
    </div>
  );
};
