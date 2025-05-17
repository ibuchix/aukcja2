
import React, { useEffect } from "react";
import { CarSearchInfoPanel } from "./info/CarSearchInfoPanel";
import { CarListingsGrid } from "./listing/CarListingsGrid";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { CarSearchErrorDisplay } from "./status/CarSearchErrorDisplay";
import { NoResultsFound } from "./status/NoResultsFound";
import { useCarSearch } from "./hooks/useCarSearch";
import { CarSearchFilters } from "./filters/CarSearchFilters";
import { AuctionPagination } from "../auction/AuctionPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

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
  
  // Log dealer ID for debugging
  useEffect(() => {
    if (isDev) {
      console.log("CarSearch component mounted with dealer ID:", dealerId);
    }
  }, [dealerId, isDev]);

  return (
    <div className="space-y-6 pb-20">
      <CarSearchInfoPanel />

      {/* Always show search filters */}
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

      {/* Debugging Info */}
      {isDev && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Car Search Debug: Using dealer ID: {dealerId} | 
            Active filters: {Object.keys(filters).length} | 
            Results: {listings.length}
          </AlertDescription>
        </Alert>
      )}

      {error ? (
        <CarSearchErrorDisplay 
          onRefresh={refetch}
          errorMessage={error instanceof Error ? error.message : String(error)}
        />
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
