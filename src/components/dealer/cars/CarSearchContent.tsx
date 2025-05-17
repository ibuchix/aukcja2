
import React from "react";
import { CarSearchInfoPanel } from "./info/CarSearchInfoPanel";
import { CarListingsGrid } from "./listing/CarListingsGrid";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { CarSearchErrorDisplay } from "./status/CarSearchErrorDisplay";
import { NoResultsFound } from "./status/NoResultsFound";
import { useCarSearch } from "./hooks/useCarSearch";
import { CarSearchFilters } from "./filters/CarSearchFilters";
import { AuctionPagination } from "../auction/AuctionPagination";

interface CarSearchContentProps {
  dealerId: string;
}

export const CarSearchContent = ({ dealerId }: CarSearchContentProps) => {
  const {
    listings,
    isLoading,
    error,
    filters,
    sortOption,
    searchQuery,
    canGoNext,
    currentPage,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch,
    clearFilters
  } = useCarSearch(dealerId);

  // Show debug information in development environment
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="space-y-6">
      <CarSearchInfoPanel />

      <CarSearchFilters
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        searchQuery={searchQuery}
      />

      <div className="flex justify-between items-center">
        <RefreshListingsButton onRefresh={refetch} />
        
        {isDev && (
          <div className="text-xs text-muted-foreground">
            Dealer ID: {dealerId}
          </div>
        )}
      </div>

      {error ? (
        <CarSearchErrorDisplay />
      ) : (
        <>
          {listings.length === 0 && !isLoading ? (
            <NoResultsFound 
              searchQuery={searchQuery} 
              onClearFilters={clearFilters} 
            />
          ) : (
            <CarListingsGrid 
              listings={listings} 
              isLoading={isLoading} 
            />
          )}

          <AuctionPagination
            hasMore={canGoNext}
            canGoBack={currentPage > 1}
            onNext={handleNextPage}
            onPrevious={handlePreviousPage}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};
